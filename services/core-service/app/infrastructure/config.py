from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    db_host: str = "localhost"
    db_port: str = "5432"
    db_name: str = "drivemind"
    db_user: str = "postgres"
    db_password: str = "postgres"
    secret_key: str = "drivemind-super-secret-change-in-prod"
    algorithm: str = "HS256"

    @property
    def database_url(self) -> str:
        return f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
