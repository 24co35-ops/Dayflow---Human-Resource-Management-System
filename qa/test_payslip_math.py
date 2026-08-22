def calculate_net(gross: int, deductions: int) -> int:
    return gross - deductions

def test_payslip_net_math():
    assert calculate_net(55000, 3200) == 51800
