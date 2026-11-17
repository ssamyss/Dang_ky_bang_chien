require("dotenv").config();
const express = require("express"),
  sql = require("mssql"),
  bcrypt = require("bcryptjs"),
  crypto = require("crypto"),
  path = require("path");
const E = process.env,
  PORT = E.PORT || 3000,
  TZ = E.TZ_NAME || "Asia/Ho_Chi_Minh",
  SECURE = E.COOKIE_SECURE === "1",
  INVITE = E.INVITE_CODE || "",
  DBNAME = E.DB_NAME || "BangHoi";
const SCHOOLS = [
    "Thần Tương",
    "Cửu Linh",
    "Huyết Hà",
    "Thiết Y",
    "Tố Vấn",
    "Long Ngâm",
    "Toái Mông",
    "Huyền Cơ",
  ],
  CAP = {};
[
  ["mid", 5],
  ["tru", 2],
  ["canh", 3],
].forEach(([k, n]) => {
  for (let i = 1; i <= n; i++) CAP[k + i] = 6;
});
if (!/^[A-Za-z0-9_]+$/.test(DBNAME)) {
  console.error("DB_NAME chỉ gồm chữ, số và dấu gạch dưới");
  process.exit(1);
}
const cfg = (db) => ({
  server: E.DB_SERVER || "localhost",
  ...(E.DB_INSTANCE ? {} : { port: Number(E.DB_PORT || 1433) }),
  database: db,
  user: E.DB_USER,
  password: E.DB_PASSWORD,
  options: {
    encrypt: E.DB_ENCRYPT !== "0",
    trustServerCertificate: E.DB_TRUST_CERT === "1",
    ...(E.DB_INSTANCE ? { instanceName: E.DB_INSTANCE } : {}),
  },
  pool: { max: 10, min: 0 },
  connectionTimeout: 15000,
});
let pool;
const q = async (text, p = {}, conn = pool) => {
  const r = conn.request();
  for (const [k, v] of Object.entries(p))
    Array.isArray(v) ? r.input(k, v[0], v[1]) : r.input(k, v);
  return (await r.query(text)).recordset || [];
};
const one = async (t, p, c) => (await q(t, p, c))[0];
const SCHEMA = [
  `IF OBJECT_ID('dbo.users','U') IS NULL CREATE TABLE dbo.users(id INT IDENTITY(1,1) PRIMARY KEY,name NVARCHAR(24) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,hash NVARCHAR(100) NOT NULL,role NVARCHAR(10) NOT NULL DEFAULT 'member',CONSTRAINT UQ_users_name UNIQUE(name))`,
  `IF OBJECT_ID('dbo.sessions','U') IS NULL CREATE TABLE dbo.sessions(token NVARCHAR(64) PRIMARY KEY,user_id INT NOT NULL REFERENCES dbo.users(id) ON DELETE CASCADE,exp BIGINT NOT NULL)`,
  `IF OBJECT_ID('dbo.reg','U') IS NULL CREATE TABLE dbo.reg(user_id INT NOT NULL REFERENCES dbo.users(id) ON DELETE CASCADE,war NVARCHAR(10) NOT NULL,nick NVARCHAR(24) NOT NULL,school NVARCHAR(20) NOT NULL,attend BIT NOT NULL,PRIMARY KEY(user_id,war))`,
  `IF OBJECT_ID('dbo.teams','U') IS NULL CREATE TABLE dbo.teams(user_id INT NOT NULL REFERENCES dbo.users(id) ON DELETE CASCADE,war NVARCHAR(10) NOT NULL,team NVARCHAR(10) NOT NULL,PRIMARY KEY(user_id,war))`,
  `IF OBJECT_ID('dbo.events','U') IS NULL CREATE TABLE dbo.events(id INT IDENTITY(1,1) PRIMARY KEY,title NVARCHAR(60) NOT NULL,ev_date NVARCHAR(10) NOT NULL,descr NVARCHAR(200) NOT NULL DEFAULT '')`,
  `IF COL_LENGTH('dbo.users','status') IS NULL ALTER TABLE dbo.users ADD status NVARCHAR(10) NOT NULL CONSTRAINT DF_users_status DEFAULT 'active'`,
];
function warDate() {
  const n = new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
  let d = (6 - n.getDay() + 7) % 7;
  if (d === 0 && n.getHours() >= 22) d = 7;
  n.setDate(n.getDate() + d);
  return (
    n.getFullYear() +
    "-" +
    String(n.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(n.getDate()).padStart(2, "0")
  );
}
const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");
const h = (f) => (req, res, next) =>
  Promise.resolve(f(req, res, next)).catch((e) => {
    console.error(e);
    res.status(500).json({ error: "Lỗi máy chủ" });
  });
app.use((req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "same-origin",
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
  });
  next();
});
app.use(express.json({ limit: "10kb" }));
const cookie = (req, k) =>
  ((req.headers.cookie || "")
    .split(";")
    .map((s) => s.trim().split("="))
    .find((a) => a[0] === k) || [])[1];
app.use(
  h(async (req, res, next) => {
    const t = cookie(req, "sid");
    req.user = t
      ? (await one(
          "SELECT u.id,u.name,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=@t AND s.exp>@now AND u.status='active'",
          { t, now: [sql.BigInt, Date.now()] },
        )) || null
      : null;
    next();
  }),
);
const need =
  (...roles) =>
  (req, res, next) =>
    !req.user
      ? res.status(401).json({ error: "Cần đăng nhập" })
      : roles.length && !roles.includes(req.user.role)
        ? res.status(403).json({ error: "Bạn không có quyền" })
        : next();
const fail = (res, c, m) => res.status(c).json({ error: m }),
  str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
async function startSession(res, uid) {
  const t = crypto.randomBytes(32).toString("hex"),
    now = Date.now();
  await q("DELETE FROM sessions WHERE exp<@now", { now: [sql.BigInt, now] });
  await q("INSERT INTO sessions(token,user_id,exp) VALUES(@t,@u,@exp)", {
    t,
    u: uid,
    exp: [sql.BigInt, now + 30 * 864e5],
  });
  res.append(
    "Set-Cookie",
    `sid=${t}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${SECURE ? "; Secure" : ""}`,
  );
}
const tries = new Map();
const slot = (req) => {
  const k = req.ip,
    n = Date.now();
  let e = tries.get(k);
  if (!e || n - e.t > 9e5) {
    e = { c: 0, t: n };
    tries.set(k, e);
  }
  return e;
};
const limited = (req) => slot(req).c >= 10,
  strike = (req) => {
    slot(req).c++;
  };
async function ensureAdmin() {
  const has = await one("SELECT 1 AS x FROM users WHERE role='owner'"),
    name = E.ADMIN_USER || "admin",
    pass = E.ADMIN_PASSWORD;
  if (!pass) {
    if (!has) {
      console.error(
        "Chưa có tài khoản Admin. Hãy đặt ADMIN_USER và ADMIN_PASSWORD (từ 8 ký tự) trong file .env rồi chạy lại.",
      );
      process.exit(1);
    }
    return;
  }
  if (pass.length < 8) {
    console.error("ADMIN_PASSWORD cần từ 8 ký tự.");
    process.exit(1);
  }
  const ex = await one("SELECT id,role FROM users WHERE name=@n", { n: name });
  if (!ex) {
    await q("INSERT INTO users(name,hash,role) VALUES(@n,@h,'owner')", {
      n: name,
      h: bcrypt.hashSync(pass, 10),
    });
    console.log("Đã tạo tài khoản Admin: " + name);
  } else if (ex.role !== "owner" || E.ADMIN_RESET === "1") {
    await q(
      "UPDATE users SET role='owner',status='active',hash=CASE WHEN @reset=1 THEN @h ELSE hash END WHERE id=@id",
      {
        id: ex.id,
        h: bcrypt.hashSync(pass, 10),
        reset: E.ADMIN_RESET === "1" ? 1 : 0,
      },
    );
    console.log("Đã cập nhật tài khoản Admin: " + name);
  }
}
app.post(
  "/api/register",
  h(async (req, res) => {
    if (limited(req))
      return fail(res, 429, "Thử quá nhiều lần, hãy đợi 15 phút");
    const name = str(req.body.name, 24),
      pass = String(req.body.pass || "");
    if (name.length < 2 || pass.length < 6)
      return fail(res, 400, "Tên từ 2 ký tự, mật khẩu từ 6 ký tự");
    if (INVITE && req.body.code !== INVITE) {
      strike(req);
      return fail(res, 403, "Sai mã mời");
    }
    if (await one("SELECT 1 AS x FROM users WHERE name=@n", { n: name }))
      return fail(res, 409, "Tên này đã có người dùng");
    try {
      await q(
        "INSERT INTO users(name,hash,role,status) VALUES(@n,@h,'member','pending')",
        { n: name, h: bcrypt.hashSync(pass, 10) },
      );
      strike(req);
      res.json({ ok: 1, pending: 1 });
    } catch (e) {
      if (e.number === 2627 || e.number === 2601)
        return fail(res, 409, "Tên này đã có người dùng");
      throw e;
    }
  }),
);
app.post(
  "/api/login",
  h(async (req, res) => {
    if (limited(req))
      return fail(res, 429, "Thử quá nhiều lần, hãy đợi 15 phút");
    const u = await one("SELECT id,hash,status FROM users WHERE name=@n", {
      n: str(req.body.name, 24),
    });
    if (!u || !bcrypt.compareSync(String(req.body.pass || ""), u.hash)) {
      strike(req);
      return fail(res, 401, "Sai tên hoặc mật khẩu");
    }
    if (u.status !== "active")
      return fail(
        res,
        403,
        "Tài khoản đang chờ duyệt. Hãy liên hệ Admin hoặc quản trị viên của bang.",
      );
    await startSession(res, u.id);
    res.json({ ok: 1 });
  }),
);
app.post(
  "/api/logout",
  h(async (req, res) => {
    const t = cookie(req, "sid");
    if (t) await q("DELETE FROM sessions WHERE token=@t", { t });
    res.append("Set-Cookie", "sid=; Max-Age=0; Path=/");
    res.json({ ok: 1 });
  }),
);
app.get(
  "/api/state",
  h(async (req, res) => {
    const war = warDate();
    res.set("Cache-Control", "no-store");
    if (!req.user) return res.json({ me: null, war, needCode: !!INVITE });
    if (req.user.role === "member") {
      const m = await one(
          "SELECT nick,school,attend FROM reg WHERE user_id=@u AND war=@w",
          { u: req.user.id, w: war },
        ),
        t = await one("SELECT team FROM teams WHERE user_id=@u AND war=@w", {
          u: req.user.id,
          w: war,
        }),
        reg = {},
        teams = {};
      if (m)
        reg[req.user.id] = { char: m.nick, school: m.school, go: !!m.attend };
      if (m && m.attend && t)
        (
          await q(
            "SELECT r.user_id,r.nick,r.school FROM teams t JOIN reg r ON r.user_id=t.user_id AND r.war=t.war WHERE t.war=@w AND t.team=@team AND r.attend=1 ORDER BY r.nick",
            { w: war, team: t.team },
          )
        ).forEach((r) => {
          reg[r.user_id] = { char: r.nick, school: r.school, go: true };
          teams[r.user_id] = t.team;
        });
      return res.json({ me: req.user, war, reg, teams, users: [], events: [] });
    }
    const reg = {},
      teams = {};
    (
      await q("SELECT user_id,nick,school,attend FROM reg WHERE war=@w", {
        w: war,
      })
    ).forEach(
      (r) =>
        (reg[r.user_id] = { char: r.nick, school: r.school, go: !!r.attend }),
    );
    (
      await q("SELECT user_id,team FROM teams WHERE war=@w", { w: war })
    ).forEach((r) => (teams[r.user_id] = r.team));
    res.json({
      me: req.user,
      war,
      reg,
      teams,
      users: await q(
        "SELECT id,name,role FROM users WHERE status='active' ORDER BY id",
      ),
      pending: await q(
        "SELECT id,name FROM users WHERE status='pending' ORDER BY id",
      ),
      events: await q(
        "SELECT id,title,ev_date AS [date],descr AS [desc] FROM events ORDER BY ev_date,id",
      ),
    });
  }),
);
app.post(
  "/api/reg",
  need(),
  h(async (req, res) => {
    const char = str(req.body.char, 24),
      school = req.body.school,
      go = req.body.go === true,
      war = warDate();
    if (!char || !SCHOOLS.includes(school))
      return fail(res, 400, "Thiếu tên nhân vật hoặc phái không hợp lệ");
    await q(
      `UPDATE reg WITH (UPDLOCK,SERIALIZABLE) SET nick=@nick,school=@school,attend=@a WHERE user_id=@u AND war=@w;
    IF @@ROWCOUNT=0 INSERT INTO reg(user_id,war,nick,school,attend) VALUES(@u,@w,@nick,@school,@a)`,
      { u: req.user.id, w: war, nick: char, school, a: go },
    );
    if (!go)
      await q("DELETE FROM teams WHERE user_id=@u AND war=@w", {
        u: req.user.id,
        w: war,
      });
    res.json({ ok: 1 });
  }),
);
app.post(
  "/api/team",
  need("owner", "dg"),
  h(async (req, res) => {
    const war = warDate(),
      uid = Number(req.body.user_id),
      team = req.body.team;
    if (!Number.isInteger(uid)) return fail(res, 400, "Thiếu người dùng");
    if (team !== null && !CAP[team]) return fail(res, 400, "Team không hợp lệ");
    if (team === null) {
      await q("DELETE FROM teams WHERE user_id=@u AND war=@w", {
        u: uid,
        w: war,
      });
      return res.json({ ok: 1 });
    }
    if (
      !(await one(
        "SELECT 1 AS x FROM reg WHERE user_id=@u AND war=@w AND attend=1",
        { u: uid, w: war },
      ))
    )
      return fail(res, 400, "Người này chưa báo danh tham gia");
    const tx = new sql.Transaction(pool);
    await tx.begin();
    let full = false;
    try {
      const lk = await one(
        "DECLARE @r INT;EXEC @r=sp_getapplock @Resource='bh_team',@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000;SELECT @r AS r",
        {},
        tx,
      );
      if (lk.r < 0) throw new Error("Không khoá được để xếp team");
      const n = (
        await one(
          "SELECT COUNT(*) AS c FROM teams t JOIN reg r ON r.user_id=t.user_id AND r.war=t.war WHERE t.war=@w AND t.team=@t AND r.attend=1 AND t.user_id<>@u",
          { w: war, t: team, u: uid },
          tx,
        )
      ).c;
      if (n >= CAP[team]) full = true;
      else
        await q(
          "UPDATE teams SET team=@t WHERE user_id=@u AND war=@w;IF @@ROWCOUNT=0 INSERT INTO teams(user_id,war,team) VALUES(@u,@w,@t)",
          { u: uid, w: war, t: team },
          tx,
        );
      await tx.commit();
    } catch (e) {
      await tx.rollback().catch(() => {});
      throw e;
    }
    if (full) return fail(res, 409, "Đội đã đủ " + CAP[team] + " người");
    res.json({ ok: 1 });
  }),
);
app.post(
  "/api/events",
  need("owner", "dg"),
  h(async (req, res) => {
    const title = str(req.body.title, 60),
      date = str(req.body.date, 10),
      desc = str(req.body.desc, 200);
    if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date))
      return fail(res, 400, "Thiếu tên hoặc ngày");
    await q("INSERT INTO events(title,ev_date,descr) VALUES(@t,@d,@x)", {
      t: title,
      d: date,
      x: desc,
    });
    res.json({ ok: 1 });
  }),
);
app.delete(
  "/api/events/:id",
  need("owner", "dg"),
  h(async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isInteger(id))
      await q("DELETE FROM events WHERE id=@id", { id });
    res.json({ ok: 1 });
  }),
);
app.post(
  "/api/role",
  need("owner"),
  h(async (req, res) => {
    const role = req.body.role,
      uid = Number(req.body.user_id);
    if (!["dg", "member"].includes(role) || !Number.isInteger(uid))
      return fail(res, 400, "Dữ liệu không hợp lệ");
    await q("UPDATE users SET role=@r WHERE id=@u AND role<>'owner'", {
      r: role,
      u: uid,
    });
    res.json({ ok: 1 });
  }),
);
app.post(
  "/api/approve",
  need("owner", "dg"),
  h(async (req, res) => {
    const id = Number(req.body.user_id);
    if (!Number.isInteger(id)) return fail(res, 400, "Dữ liệu không hợp lệ");
    if (req.body.ok === true)
      await q(
        "UPDATE users SET status='active' WHERE id=@id AND status='pending'",
        { id },
      );
    else await q("DELETE FROM users WHERE id=@id AND status='pending'", { id });
    res.json({ ok: 1 });
  }),
);
app.delete(
  "/api/users/:id",
  need("owner", "dg"),
  h(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return fail(res, 400, "Dữ liệu không hợp lệ");
    const t = await one(
      "SELECT id,role FROM users WHERE id=@id AND status='active'",
      { id },
    );
    if (!t) return fail(res, 404, "Không tìm thấy tài khoản");
    if (t.role === "owner" || t.id === req.user.id)
      return fail(res, 403, "Không thể xoá tài khoản này");
    if (t.role === "dg" && req.user.role !== "owner")
      return fail(res, 403, "Chỉ Admin mới xoá được quản trị viên");
    await q("DELETE FROM users WHERE id=@id", { id });
    res.json({ ok: 1 });
  }),
);
app.get("/vendor/gsap.min.js", (q, r) =>
  r.sendFile(path.join(__dirname, "node_modules/gsap/dist/gsap.min.js")),
);
app.get("/vendor/Sortable.min.js", (q, r) =>
  r.sendFile(path.join(__dirname, "node_modules/sortablejs/Sortable.min.js")),
);
app.use(express.static(path.join(__dirname, "public")));
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let i = 1; ; i++) {
    try {
      if (i === 1) {
        try {
          const m = await new sql.ConnectionPool(cfg("master")).connect();
          await m
            .request()
            .input("n", DBNAME)
            .query("IF DB_ID(@n) IS NULL EXEC('CREATE DATABASE ['+@n+']')");
          await m.close();
        } catch (e) {
          console.log(
            "Chưa tự tạo được database (" +
              e.message +
              "). Thử kết nối thẳng vào " +
              DBNAME +
              "...",
          );
        }
      }
      pool = await new sql.ConnectionPool(cfg(DBNAME)).connect();
      pool.on("error", (e) =>
        console.error("Lỗi kết nối SQL Server:", e.message),
      );
      for (const s of SCHEMA) await pool.request().query(s);
      break;
    } catch (e) {
      if (i >= 5) {
        console.error(
          "Không kết nối được SQL Server:",
          e.message,
          "\nKiểm tra file .env, dịch vụ SQL Server, TCP/IP và chế độ đăng nhập SQL.",
        );
        process.exit(1);
      }
      console.log("Chờ SQL Server... (" + i + "): " + e.message);
      await sleep(3000);
    }
  }
  await ensureAdmin();
  app.listen(PORT, () =>
    console.log("Bang Hội chạy tại http://localhost:" + PORT),
  );
})();
