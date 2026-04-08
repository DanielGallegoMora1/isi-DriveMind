from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    db_host: str
    db_port: str
    db_name: str
    db_user: str
    db_password: str
    hf_token: str = ""

    @property
    def database_url(self) -> str:
        return f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
