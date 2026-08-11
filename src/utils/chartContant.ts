import { UnifiedDataItem } from "../components/organisms/performance-management-customizations/chart-widgets/TemplateSkeleton";

export const chartColor = {
    chartJsonDotColor1: "#FF6B6B",
    chartJsonDotColor2: "#FFC033",
    chartJsonDotColor3: "#00B097",
    chartJsonDotColor4: "#DEDEDE",
    projectionIndex: "#DEDEDE",
    isForecast: "#73C15D",
    isForecast2: "#E899AD",
    projectionConfig: "#E85A8C",
    toDateValue: {
        color1: "#9AA0A6",
        color2: "#4B5563",
        color3: "#3A7D34"
    },
    isForecast3: "green",
    targetColors: {
        color1: "#4A4A4A",
        color2: "#8A8A8A",
        color3: "#66A3FF",
        color4: "#FF9355",
        color5: "#7BC96F"
    },
    toleranceBands: {
        color1: "#DEDEDE",
    },
    legendsLabels: {
        color1: "#B39DDB",
        color2: "#F2C94C",
        color3: "#B7D36F",
        color4: "#4DB6AC",
        color5: "#DCCAF5",
        color6: "#FFDB8A",
        color7: "#79A2CB",
        color8: "#B2AFFB",
        color9: "#FFCA54",
        color10: "#86ACD2",


    },
    defaultProjectionToolTipAi: "#fff",
    defaultProjectionToolTipAiBg: "#000",
    legendsLabelsTargetDefault: "#1C1C1C",
    legendLabelDefaultColor: "#666666",
    cartesianGridColor: "#DEDEDE",
    stripedPatternColor: "#DCCAF5",
    stripedPatternColor2: "#cac9f2",
    stripedPatternColor3: "#9ec0e1",
    stripedPatternBackgroundColor: "#fff",
    bar2StripedPatternColor: "#6EABE9",
    bar2StripedPatternColorGrouped: "#B2AFFB",
    projectionLimitMarkerBackgroundColor: "#F943AE",
    projectionLimitMarkerBackgroundColor1: "#E899AD",
    legendItemFillColor2: "#DEDEDE",
    lineStrockColor: "#000",
    lineStrockColor2: "#4A4A4A",
    projectionLimitMarkerColor: "#E899AD",
    seriesColor: {
        lineChart: "#B39DDB",
        stackedLine1: "#F2C94C",
        stackedLine2: "#B7D36F",
        stackedLine3: "#4DB6AC",
        area: "#B2AFFB",
        stackedArea: "#B2AFFB",
        stackedArea2: "#FFCA54",
        stackedArea3: "#86ACD2"
    },
    barFill: {
        color1: "#B2AFFB",
        stackedBar: "#DCCAF5",
        stackedBar2: "#FFDB8A",
        stackedBar3: "#79A2CB",
        stackedColumn1: "#54CAB9",
        stackedColumn2: "#6EABE9",
        stackedColumn3: "#D3BDF2",
        groupBar1: "#D3BDF2",
        groupBar2: "#B2AFFB",
        groupBar3: "#79A2CB",
        simpleBar: "#D3BDF2",

    }
}
export const LOCAL_UNIFIED_CHART_DATA: UnifiedDataItem[]= [
    {
        month: "Jan",
        year: 2026,
        Planned: 50,
        dotColor: chartColor.chartJsonDotColor1,
        isForecast: false,
        metrics: {
            "CAPA-Overdue": 72,
            "CAPA-Count": 46,
            "CAPA-Aging": 31
        },
        targets: {
            "OTIF-D-Target": 95,
            "OTIF-D-Tolerance": 40,
            "CAPA-A1Target": 20,
            "CAPA-A1Tolerance": 20,
            "CAPA-A2 Target": 15,
            "CAPA-A2 Tolerance": 15,
            "CAPA-A3 Target": 5,
            "CAPA-A3 Tolerance": 5
        }
    },
    {
        month: "Feb",
        year: 2026,
        Planned: 30,
        dotColor: chartColor.chartJsonDotColor2,
        isForecast: false,
        ToleranceTooltipLabel: "Within Tolerance",
        metrics: {
            "CAPA-Overdue": 66,
            "CAPA-Count": 52,
            "CAPA-Aging": 38
        },
        targets: {
            "OTIF-D Target": 80,
            "OTIF-D Tolerance": 30,
            "CAPA-A1 Target": 25,
            "CAPA-A1 Tolerance": 25,
            "CAPA-A2 Target": 15,
            "CAPA-A2 Tolerance": 15,
            "CAPA-A3 Target": 10,
            "CAPA-A3 Tolerance": 10
        }
    },
    {
        month: "Mar",
        year: 2026,
        Planned: 60,
        dotColor: chartColor.chartJsonDotColor3,
        isForecast: false,
        ToleranceTooltipLabel: "On Target",
        metrics: {
            "CAPA-Overdue": 78,
            "CAPA-Count": 61,
            "CAPA-Aging": 44
        },
        targets: {
            "OTIF-D Target": 50.5,
            "OTIF-D Tolerance": 20,
            "CAPA-A1 Target": 30,
            "CAPA-A1 Tolerance": 30,
            "CAPA-A2 Target": 20,
            "CAPA-A2 Tolerance": 20,
            "CAPA-A3 Target": 15,
            "CAPA-A3 Tolerance": 15
        }
    },
    {
        month: "Apr",
        year: 2026,
        Planned: 50,
        dotColor: chartColor.chartJsonDotColor2,
        isForecast: false,
        metrics: {
            "CAPA-Overdue": 69,
            "CAPA-Count": 55,
            "CAPA-Aging": 36
        },
        targets: {
            "OTIF-D Target": 49.5,
            "OTIF-D Tolerance": 40,
            "CAPA-A1 Target": 30,
            "CAPA-A1 Tolerance": 30,
            "CAPA-A2 Target": 32,
            "CAPA-A2 Tolerance": 32,
            "CAPA-A3 Target": 25,
            "CAPA-A3 Tolerance": 25
        }
    },
    {
        month: "May",
        year: 2026,
        Planned: 60,
        dotColor: chartColor.chartJsonDotColor1,
        isForecast: false,
        metrics: {
            "CAPA-Overdue": 84,
            "CAPA-Count": 64,
            "CAPA-Aging": 49
        },
        targets: {
            "OTIF-D Target": 50.5,
            "OTIF-D Tolerance": 25,
            "CAPA-A1 Target": 32,
            "CAPA-A1 Tolerance": 32,
            "CAPA-A2 Target": 35,
            "CAPA-A2 Tolerance": 35,
            "CAPA-A3 Target": 27,
            "CAPA-A3 Tolerance": 27
        }
    },
    {
        month: "Jun",
        year: 2026,
        Planned: 70,
        dotColor: chartColor.chartJsonDotColor1,
        isForecast: false,
        metrics: {
            "CAPA-Overdue": 76,
            "CAPA-Count": 59,
            "CAPA-Aging": 42
        },
        targets: {
            "OTIF-D Target": 79,
            "OTIF-D Tolerance": 35,
            "CAPA-A1 Target": 36,
            "CAPA-A1 Tolerance": 36,
            "CAPA-A2 Target": 37,
            "CAPA-A2 Tolerance": 37,
            "CAPA-A3 Target": 27,
            "CAPA-A3 Tolerance": 27
        }
    },
    {
        month: "Jul",
        year: 2026,
        Planned: 50,
        dotColor: chartColor.chartJsonDotColor4,
        isForecast: true,
        ToleranceTooltipLabel: "Projected",
        metrics: {
            "CAPA-Overdue": 81,
            "CAPA-Count": 67,
            "CAPA-Aging": 51
        },
        targets: {
            "OTIF-D Target": 50.5,
            "OTIF-D Tolerance": 45,
            "CAPA-A1 Target": 30,
            "CAPA-A1 Tolerance": 30,
            "CAPA-A2 Target": 32,
            "CAPA-A2 Tolerance": 32,
            "CAPA-A3 Target": 25,
            "CAPA-A3 Tolerance": 25
        }
    },
    {
        month: "Aug",
        year: 2026,
        Planned: 30,
        dotColor: chartColor.chartJsonDotColor4,
        isForecast: true,
        ToleranceTooltipLabel: "Projected",
        metrics: {
            "CAPA-Overdue": 74,
            "CAPA-Count": 57,
            "CAPA-Aging": 43
        },
        targets: {
            "OTIF-D Target": 49.5,
            "OTIF-D Tolerance": 15,
            "CAPA-A1 Target": 40,
            "CAPA-A1 Tolerance": 40,
            "CAPA-A2 Target": 42,
            "CAPA-A2 Tolerance": 42,
            "CAPA-A3 Target": 35,
            "CAPA-A3 Tolerance": 35
        }
    },
    {
        month: "Sep",
        year: 2026,
        Planned: 60,
        dotColor: chartColor.chartJsonDotColor4,
        isForecast: true,
        ToleranceTooltipLabel: "Projected",
        metrics: {
            "CAPA-Overdue": 87,
            "CAPA-Count": 71,
            "CAPA-Aging": 56
        },
        targets: {
            "OTIF-D Target": 50.5,
            "OTIF-D Tolerance": 30,
            "CAPA-A1 Target": 30,
            "CAPA-A1 Tolerance": 30,
            "CAPA-A2 Target": 32,
            "CAPA-A2 Tolerance": 32,
            "CAPA-A3 Target": 25,
            "CAPA-A3 Tolerance": 25
        }
    },
    {
        month: "Oct",
        year: 2026,
        Planned: 50,
        dotColor: chartColor.chartJsonDotColor4,
        isForecast: true,
        ToleranceTooltipLabel: "Projected",
        metrics: {
            "CAPA-Overdue": 79,
            "CAPA-Count": 63,
            "CAPA-Aging": 47
        },
        targets: {
            "OTIF-D Target": 49.5,
            "OTIF-D Tolerance": 50,
            "CAPA-A1 Target": 32,
            "CAPA-A1 Tolerance": 32,
            "CAPA-A2 Target": 30,
            "CAPA-A2 Tolerance": 30,
            "CAPA-A3 Target": 20,
            "CAPA-A3 Tolerance": 20
        }
    },
    {
        month: "Nov",
        year: 2026,
        Planned: 70,
        dotColor: chartColor.chartJsonDotColor4,
        isForecast: true,
        ToleranceTooltipLabel: "Projected",
        metrics: {
            "CAPA-Overdue": 91,
            "CAPA-Count": 74,
            "CAPA-Aging": 61
        },
        targets: {
            "OTIF-D Target": 50.5,
            "OTIF-D Tolerance": 30,
            "CAPA-A1 Target": 35,
            "CAPA-A1 Tolerance": 35,
            "CAPA-A2 Target": 36,
            "CAPA-A2 Tolerance": 36,
            "CAPA-A3 Target": 22,
            "CAPA-A3 Tolerance": 25
        }
    },
    {
        month: "Dec",
        year: 2026,
        Planned: 90,
        dotColor: chartColor.chartJsonDotColor4,
        isForecast: true,
        ToleranceTooltipLabel: "Projected",
        metrics: {
            "CAPA-Overdue": 83,
            "CAPA-Count": 68,
            "CAPA-Aging": 52
        },
        targets: {
            "OTIF-D Target": 49.5,
            "OTIF-D Tolerance": 40,
            "CAPA-A1 Target": 35,
            "CAPA-A1 Tolerance": 35,
            "CAPA-A2 Target": 36,
            "CAPA-A2 Tolerance": 36,
            "CAPA-A3 Target": 22,
            "CAPA-A3 Tolerance": 25
        }
    }
];