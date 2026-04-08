from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    bootstrap_demo_users: bool = False
    db_host: str
    db_port: str
    db_name: str
    db_user: str
    db_password: str
    secret_key: str = "drivemind-super-secret-change-in-prod"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    model_config = {"env_file": ".env", "extra": "ignore"}

    demo_system_admin_email: str = "system.admin@example.com"

    demo_system_admin_password: str = "Admin123!"
    demo_system_admin_full_name: str = "DriveMind System Admin"
    demo_school_name: str = "DriveMind Demo School"
    demo_school_email: str = "school.admin@example.com"
    demo_school_password: str = "School123!"
    demo_school_admin_full_name: str = "DriveMind Demo School Admin"
    demo_student_email: str = "student@example.com"
    demo_student_password: str = "Student123!"
    demo_student_full_name: str = "DriveMind Demo Student"
    demo_student_document_id: str = "DEMO-0001"
    demo_student_license_code: str = "B"

    @property
    def database_url(self) -> str:
        return f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"


settings = Settings()
