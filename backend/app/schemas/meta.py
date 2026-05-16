from pydantic import BaseModel, ConfigDict, Field


class AboutResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str
    email: str
    my_features: dict[str, str]
    my_features_display: dict[str, str] = Field(serialization_alias="my features")
