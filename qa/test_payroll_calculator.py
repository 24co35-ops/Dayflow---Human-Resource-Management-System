import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parents[1] / "backend"))

from app.dayflow_payroll import SalaryComponentConfig, SalaryConfig, calculate_salary  # noqa: E402


def default_components() -> list[SalaryComponentConfig]:
    return [
        SalaryComponentConfig(name="basic", computation_type="percentage", value=50),
        SalaryComponentConfig(
            name="hra", computation_type="percentage", value=50, base="basic"
        ),
        SalaryComponentConfig(
            name="standard_allowance", computation_type="fixed", value=4167
        ),
        SalaryComponentConfig(
            name="performance_bonus",
            computation_type="percentage",
            value=8.33,
            base="basic",
        ),
        SalaryComponentConfig(
            name="leave_travel_allowance",
            computation_type="percentage",
            value=8.33,
            base="basic",
        ),
        SalaryComponentConfig(
            name="fixed_allowance", computation_type="fixed", value=0
        ),
    ]


def test_salary_components_recalculate_from_wage() -> None:
    breakdown = calculate_salary(
        SalaryConfig(wage=50000, components=default_components())
    )
    assert breakdown.basic_salary == 25000
    assert breakdown.hra_allowance == 12500
    assert breakdown.standard_allowance == 4167
    assert breakdown.fixed_allowance == 4168
    assert breakdown.gross_salary == 50000
    assert breakdown.pf_contribution == 3000
    assert breakdown.professional_tax == 200
    assert breakdown.net_salary == 46800


def test_salary_components_cannot_exceed_wage() -> None:
    components = default_components()
    components[2] = SalaryComponentConfig(
        name="standard_allowance", computation_type="fixed", value=50000
    )
    with pytest.raises(ValueError, match="cannot exceed"):
        calculate_salary(SalaryConfig(wage=50000, components=components))


def test_missing_attendance_reduces_payable_salary() -> None:
    breakdown = calculate_salary(
        SalaryConfig(wage=50000, components=default_components()),
        payable_days=11,
        scheduled_days=22,
    )
    assert breakdown.wage == 25000
    assert breakdown.gross_salary == 25000
    assert breakdown.basic_salary == 12500
    assert breakdown.net_salary < 46800
