# miniPDD

Docker 一键启动拼团商城（前端 + 后端 + MySQL + Redis + RabbitMQ）

---

## 🚀 启动全部服务

```bash
docker-compose -f docker-compose-full.yml up -d --build
```

查看容器状态：

```bash
docker-compose -f docker-compose-full.yml ps
```

---

## 🗄 初始化数据库（为前端添加拼团数据，用户可点击“参与拼团”加入）

```bash
docker cp .\group-buy-market-master\docs\dev-ops\mysql\sql\2-29-group_buy_market.sql mysql:/tmp/init.sql
docker exec -i mysql sh -c "mysql -uroot -p123456 --default-character-set=utf8mb4 < /tmp/init.sql"
```

---

## 🌐 访问前端

```
http://localhost/index.html
```

浏览器刷新即可看到拼团列表。

---

## 📜 查看日志（可选）

```bash
docker-compose -f docker-compose-full.yml logs -f
```

---

## 🛑 停止服务（可选）

```bash
docker-compose -f docker-compose-full.yml down
```

彻底清理（删除数据卷）：

```bash
docker-compose -f docker-compose-full.yml down -v
```

---

## ⚡ Quick Start（三步极简）

```bash
docker-compose -f docker-compose-full.yml up -d --build
docker cp .\group-buy-market-master\docs\dev-ops\mysql\sql\2-29-group_buy_market.sql mysql:/tmp/init.sql
docker exec -i mysql sh -c "mysql -uroot -p123456 --default-character-set=utf8mb4 < /tmp/init.sql"
```

打开：http://localhost/index.html
