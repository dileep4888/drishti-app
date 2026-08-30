# DRISHTI Backend — Setup Guide

## 1. Install dependencies
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## 2. Set up the database
- Install MySQL locally (or use a free hosted DB like PlanetScale/Railway for the hackathon demo).
- Create a database named `drishti_db`.
- Run the schema:
```bash
mysql -u root -p drishti_db < ../db/schema.sql
```

## 3. Configure environment
Create a `.env` file inside `backend/`:
```
DATABASE_URL=mysql+pymysql://root:yourpassword@localhost:3306/drishti_db
SECRET_KEY=some-long-random-string-here
```

## 4. Run the server
```bash
uvicorn app.main:app --reload
```
Server runs at `http://localhost:8000`. Interactive API docs at `http://localhost:8000/docs`
(FastAPI auto-generates this — very useful for testing endpoints without Postman).

## 5. Test it
1. Open `/docs`, try `POST /auth/register` with a JSON body:
```json
{
  "name": "Dileep",
  "email": "dileep@test.com",
  "password": "test1234",
  "role": "department_official"
}
```
2. Copy the `access_token` from the response.
3. Click "Authorize" at the top of `/docs`, paste the token.
4. Try `GET /dashboard/officials-only` — should work.
5. Register a second user with `role: inspector`, try the same endpoint with their token —
   should get a 403 Forbidden. This proves role-based access is working.

## What's built so far
- [x] User auth (register/login) with JWT
- [x] Role-based access control (4 roles)
- [x] DB schema — users, institutes, inspections, evidence, VC calls, risk flags
- [ ] Institute CRUD + random assignment engine (next step)
- [ ] Inspection submission + evidence upload endpoint
- [ ] AI anomaly detection service
- [ ] RTSP CCTV simulation endpoint
