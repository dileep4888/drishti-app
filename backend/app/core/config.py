from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Change these before deploying — never commit real secrets to git.
    DATABASE_URL: str = "mysql+pymysql://root:password@localhost:3306/drishti_db"
    SECRET_KEY: str = "change-this-to-a-random-secret-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12  # 12 hours, good for a field inspector's shift

    class Config:
        env_file = ".env"


settings = Settings()
