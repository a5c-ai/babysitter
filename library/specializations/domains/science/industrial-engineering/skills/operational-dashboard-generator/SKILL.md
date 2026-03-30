---
name: operational-dashboard-generator
description: Operational dashboard generation skill for KPI visualization and real-time monitoring.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: continuous-improvement
  backlog-id: SK-IE-037
---

# operational-dashboard-generator

You are **operational-dashboard-generator** - a specialized skill for generating operational dashboards with KPI visualization and real-time monitoring capabilities.

## Overview

This skill enables AI-powered dashboard generation including:
- KPI definition and calculation
- Visual hierarchy design
- Alert threshold configuration
- Trend analysis displays
- Drill-down capabilities
- Real-time data integration
- Performance comparison views
- Custom metric creation

## Capabilities

### 1. KPI Definition Framework

```python
import pandas as pd
import numpy as np
from dataclasses import dataclass
from typing import List, Dict, Optional
from enum import Enum

class KPICategory(Enum):
    SAFETY = "safety"
    QUALITY = "quality"
    DELIVERY = "delivery"
    COST = "cost"
    PRODUCTIVITY = "productivity"
    MORALE = "morale"

@dataclass
class KPIDefinition:
    id: str
    name: str
    category: KPICategory
    formula: str
    unit: str
    target: float
    warning_threshold: float
    critical_threshold: float
    higher_is_better: bool = True
    frequency: str = "daily"

def create_kpi_library():
    """Standard industrial KPI definitions"""
    return [
        KPIDefinition(
            id="oee", name="OEE", category=KPICategory.PRODUCTIVITY,
            formula="availability * performance * quality",
            unit="%", target=85, warning_threshold=75, critical_threshold=65
        ),
        KPIDefinition(
            id="fpy", name="First Pass Yield", category=KPICategory.QUALITY,
            formula="good_units / total_units * 100",
            unit="%", target=98, warning_threshold=95, critical_threshold=90
        ),
        KPIDefinition(
            id="otd", name="On-Time Delivery", category=KPICategory.DELIVERY,
            formula="on_time_orders / total_orders * 100",
            unit="%", target=98, warning_threshold=95, critical_threshold=90
        ),
        KPIDefinition(
            id="trir", name="Total Recordable Incident Rate", category=KPICategory.SAFETY,
            formula="incidents * 200000 / hours_worked",
            unit="per 200k hrs", target=0.5, warning_threshold=1.0, critical_threshold=2.0,
            higher_is_better=False
        ),
        KPIDefinition(
            id="productivity", name="Labor Productivity", category=KPICategory.PRODUCTIVITY,
            formula="units_produced / labor_hours",
            unit="units/hr", target=25, warning_threshold=20, critical_threshold=15
        ),
        KPIDefinition(
            id="scrap_rate", name="Scrap Rate", category=KPICategory.COST,
            formula="scrap_cost / production_cost * 100",
            unit="%", target=1.0, warning_threshold=2.0, critical_threshold=3.0,
            higher_is_better=False
        )
    ]

def calculate_kpi(kpi: KPIDefinition, data: dict):
    """Calculate KPI value from data"""
    # Simple formula evaluation (in production, use safe eval)
    try:
        value = eval(kpi.formula, {"__builtins__": {}}, data)

        # Determine status
        if kpi.higher_is_better:
            if value >= kpi.target:
                status = "green"
            elif value >= kpi.warning_threshold:
                status = "yellow"
            else:
                status = "red"
        else:
            if value <= kpi.target:
                status = "green"
            elif value <= kpi.warning_threshold:
                status = "yellow"
            else:
                status = "red"

        return {
            "kpi_id": kpi.id,
            "name": kpi.name,
            "value": round(value, 2),
            "unit": kpi.unit,
            "target": kpi.target,
            "status": status,
            "gap_to_target": round(value - kpi.target, 2)
        }

    except Exception as e:
        return {"kpi_id": kpi.id, "error": str(e)}
```

### 2. Dashboard Layout Generator

```python
def generate_dashboard_layout(kpis: List[KPIDefinition], layout_type: str = "standard"):
    """
    Generate dashboard layout configuration

    layout_type: 'standard', 'executive', 'operational', 'lean'
    """
    if layout_type == "standard":
        layout = {
            "type": "grid",
            "columns": 4,
            "rows": 3,
            "sections": [
                {
                    "id": "header",
                    "row": 1, "col_span": 4,
                    "content": "title_and_period_selector"
                },
                {
                    "id": "summary_cards",
                    "row": 2, "col_span": 4,
                    "content": "kpi_summary_cards",
                    "kpis": [k.id for k in kpis[:6]]
                },
                {
                    "id": "trends",
                    "row": 3, "col": 1, "col_span": 2,
                    "content": "trend_charts"
                },
                {
                    "id": "details",
                    "row": 3, "col": 3, "col_span": 2,
                    "content": "detail_tables"
                }
            ]
        }

    elif layout_type == "executive":
        layout = {
            "type": "single_page",
            "sections": [
                {"id": "headline_kpis", "position": "top", "height": "20%"},
                {"id": "trend_summary", "position": "middle", "height": "50%"},
                {"id": "action_items", "position": "bottom", "height": "30%"}
            ]
        }

    elif layout_type == "lean":
        # Visual management board style
        layout = {
            "type": "sqdc",  # Safety, Quality, Delivery, Cost
            "columns": 4,
            "sections": [
                {"id": "safety", "col": 1, "category": "SAFETY"},
                {"id": "quality", "col": 2, "category": "QUALITY"},
                {"id": "delivery", "col": 3, "category": "DELIVERY"},
                {"id": "cost", "col": 4, "category": "COST"}
            ],
            "row_types": ["current_status", "trend_sparkline", "action_items"]
        }

    return layout

def generate_kpi_card_config(kpi: KPIDefinition):
    """Generate configuration for a KPI card widget"""
    return {
        "widget_type": "kpi_card",
        "kpi_id": kpi.id,
        "title": kpi.name,
        "display": {
            "value_format": f"{{value:.1f}}{kpi.unit}",
            "show_target": True,
            "show_trend": True,
            "trend_periods": 7
        },
        "colors": {
            "green": kpi.target,
            "yellow": kpi.warning_threshold,
            "red": kpi.critical_threshold
        },
        "gauge": kpi.id in ["oee", "fpy", "otd"]  # Show gauge for percentage KPIs
    }
```

### 3. Trend Analysis

```python
def analyze_kpi_trends(historical_data: pd.DataFrame, kpi_id: str,
                      periods: int = 30):
    """
    Analyze trends for a KPI

    historical_data: DataFrame with ['date', 'kpi_id', 'value']
    """
    kpi_data = historical_data[historical_data['kpi_id'] == kpi_id].copy()
    kpi_data = kpi_data.sort_values('date').tail(periods)

    if len(kpi_data) < 2:
        return {"error": "Insufficient data for trend analysis"}

    values = kpi_data['value'].values
    dates = kpi_data['date'].values

    # Calculate statistics
    current = values[-1]
    previous = values[-2]
    change = current - previous
    change_pct = (change / previous * 100) if previous != 0 else 0

    # Moving averages
    ma_7 = np.mean(values[-7:]) if len(values) >= 7 else np.mean(values)
    ma_30 = np.mean(values[-30:]) if len(values) >= 30 else np.mean(values)

    # Trend direction (linear regression)
    x = np.arange(len(values))
    slope, intercept = np.polyfit(x, values, 1)

    if slope > 0.01:
        trend_direction = "improving"
    elif slope < -0.01:
        trend_direction = "declining"
    else:
        trend_direction = "stable"

    # Variability
    std_dev = np.std(values)
    cv = (std_dev / np.mean(values) * 100) if np.mean(values) != 0 else 0

    return {
        "kpi_id": kpi_id,
        "current_value": round(current, 2),
        "previous_value": round(previous, 2),
        "change": round(change, 2),
        "change_percent": round(change_pct, 1),
        "trend_direction": trend_direction,
        "slope": round(slope, 4),
        "moving_average_7": round(ma_7, 2),
        "moving_average_30": round(ma_30, 2),
        "std_deviation": round(std_dev, 2),
        "coefficient_of_variation": round(cv, 1),
        "sparkline_data": values.tolist()
    }
```

### 4. Alert Configuration

```python
def configure_alerts(kpis: List[KPIDefinition], notification_config: dict):
    """
    Configure alert rules for dashboard

    notification_config: {'email': [], 'sms': [], 'teams': []}
    """
    alerts = []

    for kpi in kpis:
        # Warning alert
        alerts.append({
            "alert_id": f"{kpi.id}_warning",
            "kpi_id": kpi.id,
            "level": "warning",
            "condition": f"value {'<' if kpi.higher_is_better else '>'} {kpi.warning_threshold}",
            "message": f"{kpi.name} has reached warning level",
            "notifications": notification_config.get('email', []),
            "frequency": "first_occurrence"
        })

        # Critical alert
        alerts.append({
            "alert_id": f"{kpi.id}_critical",
            "kpi_id": kpi.id,
            "level": "critical",
            "condition": f"value {'<' if kpi.higher_is_better else '>'} {kpi.critical_threshold}",
            "message": f"{kpi.name} has reached critical level - immediate action required",
            "notifications": notification_config.get('email', []) + notification_config.get('sms', []),
            "frequency": "every_occurrence",
            "escalation_after_minutes": 30
        })

        # Trend alert
        alerts.append({
            "alert_id": f"{kpi.id}_trend",
            "kpi_id": kpi.id,
            "level": "info",
            "condition": "consecutive_decline >= 3",
            "message": f"{kpi.name} has declined for 3 consecutive periods",
            "notifications": notification_config.get('email', []),
            "frequency": "daily_digest"
        })

    return {
        "alerts": alerts,
        "total_rules": len(alerts),
        "notification_channels": list(notification_config.keys())
    }
```

### 5. Drill-Down Configuration

```python
def configure_drilldowns(kpi: KPIDefinition, dimensions: list):
    """
    Configure drill-down paths for a KPI

    dimensions: ['shift', 'line', 'product', 'operator']
    """
    drilldowns = []

    for i, dim in enumerate(dimensions):
        drilldowns.append({
            "level": i + 1,
            "dimension": dim,
            "aggregation": "sum" if "count" in kpi.formula else "avg",
            "chart_type": "bar" if i < 2 else "table",
            "filter_enabled": True
        })

    # Add time-based drilldown
    drilldowns.append({
        "level": len(dimensions) + 1,
        "dimension": "time",
        "granularity": ["month", "week", "day", "shift", "hour"],
        "chart_type": "line",
        "default_granularity": "day"
    })

    return {
        "kpi_id": kpi.id,
        "drilldown_path": drilldowns,
        "max_levels": len(drilldowns)
    }
```

### 6. Dashboard Export

```python
def export_dashboard_config(layout: dict, kpis: List[dict],
                           alerts: List[dict], drilldowns: List[dict]):
    """
    Export complete dashboard configuration
    """
    config = {
        "dashboard": {
            "name": "Operations Dashboard",
            "version": "1.0",
            "refresh_rate_seconds": 300,
            "timezone": "local"
        },
        "layout": layout,
        "kpis": kpis,
        "widgets": [],
        "alerts": alerts,
        "drilldowns": drilldowns,
        "data_sources": [
            {
                "id": "production_db",
                "type": "database",
                "refresh": "5min"
            },
            {
                "id": "mes_api",
                "type": "api",
                "refresh": "realtime"
            }
        ],
        "filters": [
            {"id": "date_range", "type": "date_range", "default": "last_30_days"},
            {"id": "shift", "type": "dropdown", "options": ["All", "Day", "Night"]},
            {"id": "line", "type": "multi_select", "source": "production_db.lines"}
        ]
    }

    # Generate widgets from KPIs
    for kpi in kpis:
        config["widgets"].append({
            "widget_id": f"card_{kpi['kpi_id']}",
            "type": "kpi_card",
            "kpi": kpi['kpi_id'],
            "position": "auto"
        })

    return config
```

## Process Integration

This skill integrates with the following processes:
- `performance-monitoring-setup.js`
- `visual-management-implementation.js`
- `continuous-improvement-program.js`

## Output Format

```json
{
  "dashboard_config": {
    "name": "Operations Dashboard",
    "layout": "standard",
    "refresh_rate": 300
  },
  "kpis": [
    {
      "id": "oee",
      "name": "OEE",
      "current_value": 82.5,
      "target": 85,
      "status": "yellow",
      "trend": "improving"
    }
  ],
  "alerts": {
    "active": 2,
    "critical": 0,
    "warning": 2
  },
  "layout_spec": {
    "type": "grid",
    "columns": 4,
    "widgets": 12
  }
}
```

## Best Practices

1. **Less is more** - Focus on critical KPIs
2. **Visual hierarchy** - Most important at top
3. **Consistent colors** - Red/yellow/green standard
4. **Actionable data** - Link to root causes
5. **Appropriate refresh** - Balance timeliness vs. load
6. **Mobile-friendly** - Access anywhere

## Constraints

- Too many KPIs dilute focus
- Real-time requires infrastructure
- Data quality affects trust
- User training needed for effectiveness
