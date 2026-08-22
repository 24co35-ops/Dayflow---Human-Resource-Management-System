from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, model_validator

ComponentType = Literal["fixed", "percentage"]
ComponentBase = Literal["wage", "basic"]


class SalaryComponentConfig(BaseModel):
    name: Literal[
        "basic",
        "hra",
        "standard_allowance",
        "performance_bonus",
        "leave_travel_allowance",
        "fixed_allowance",
    ]
    computation_type: ComponentType
    value: float = Field(ge=0)
    base: ComponentBase = "wage"


class SalaryConfig(BaseModel):
    wage_type: Literal["fixed"] = "fixed"
    wage: int = Field(gt=0)
    working_days_per_week: int = Field(default=5, ge=1, le=7)
    pf_rate: float = Field(default=12, ge=0, le=100)
    professional_tax: int = Field(default=200, ge=0)
    components: list[SalaryComponentConfig]

    @model_validator(mode="after")
    def validate_components(self) -> SalaryConfig:
        names = [component.name for component in self.components]
        if len(names) != len(set(names)):
            raise ValueError("Salary component names must be unique")
        required = {
            "basic",
            "hra",
            "standard_allowance",
            "performance_bonus",
            "leave_travel_allowance",
        }
        if not required.issubset(names):
            raise ValueError(
                "Basic, HRA, standard allowance, performance bonus, and LTA are required"
            )
        return self


class SalaryBreakdown(BaseModel):
    wage: int
    basic_salary: int
    hra_allowance: int
    standard_allowance: int
    performance_bonus: int
    leave_travel_allowance: int
    fixed_allowance: int
    gross_salary: int
    pf_contribution: int
    professional_tax: int
    deductions: int
    net_salary: int


def _amount(
    component: SalaryComponentConfig, wage: float, basic: float, proration: float = 1
) -> float:
    if component.name == "fixed_allowance":
        return 0
    base_amount = wage if component.base == "wage" else basic
    return (
        component.value * proration
        if component.computation_type == "fixed"
        else base_amount * component.value / 100
    )


def calculate_salary(
    config: SalaryConfig, payable_days: int = 22, scheduled_days: int = 22
) -> SalaryBreakdown:
    if payable_days < 0 or scheduled_days <= 0 or payable_days > scheduled_days:
        raise ValueError("Payable days must be between zero and scheduled working days")
    effective_wage = round(config.wage * payable_days / scheduled_days)
    proration = payable_days / scheduled_days
    basic_component = next(
        component for component in config.components if component.name == "basic"
    )
    basic = _amount(basic_component, effective_wage, 0, proration)
    values = {
        component.name: _amount(component, effective_wage, basic, proration)
        for component in config.components
    }
    fixed_allowance = effective_wage - sum(values.values())
    if fixed_allowance < 0:
        raise ValueError("Salary components cannot exceed the defined wage")
    gross = effective_wage
    pf = basic * config.pf_rate / 100
    deductions = pf + config.professional_tax
    return SalaryBreakdown(
        wage=effective_wage,
        basic_salary=round(basic),
        hra_allowance=round(values.get("hra", 0)),
        standard_allowance=round(values.get("standard_allowance", 0)),
        performance_bonus=round(values.get("performance_bonus", 0)),
        leave_travel_allowance=round(values.get("leave_travel_allowance", 0)),
        fixed_allowance=round(fixed_allowance),
        gross_salary=gross,
        pf_contribution=round(pf),
        professional_tax=config.professional_tax,
        deductions=round(deductions),
        net_salary=round(gross - deductions),
    )
