import { EventFilterParams, FacilityFilterParams, PrimaryClass, SubClass } from "../../../api/types";

// ─── Time Presets ───────────────────────────────────────────────────────────
export type TimePreset = "24h" | "7d" | "30d" | "90d" | "custom" | "all";

export const TIME_PRESETS: { value: TimePreset; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "24h", label: "24 Hours" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "custom", label: "Custom" },
];

// ─── Anomaly Modes ──────────────────────────────────────────────────────────
export type AnomalyMode = "all" | "anomalous" | "nominal";

// ─── Typed Filter State ─────────────────────────────────────────────────────
export interface GisFilterState {
  dateRange: TimePreset;
  dateFrom: string | null; // YYYY-MM-DD (only for custom)
  dateTo: string | null;   // YYYY-MM-DD (only for custom)
  primaryClass: "" | PrimaryClass;
  subClass: "" | SubClass;
  minConfidence: number | null; // 0..1
  anomalyMode: AnomalyMode;
  state: string;
  district: string;
}

export const DEFAULT_GIS_FILTERS: GisFilterState = {
  dateRange: "all",
  dateFrom: null,
  dateTo: null,
  primaryClass: "",
  subClass: "",
  minConfidence: null,
  anomalyMode: "all",
  state: "",
  district: "",
};

// ─── Sub-class Constraints ──────────────────────────────────────────────────
const INDUSTRIAL_SUB_CLASSES: SubClass[] = [
  "industrial_fire",
  "gas_flare",
  "mining_activity",
];

const NATURAL_SUB_CLASSES: SubClass[] = [
  "forest_fire",
  "agricultural_burning",
  "other_natural",
];

const ALL_SUB_CLASSES: SubClass[] = [
  ...INDUSTRIAL_SUB_CLASSES,
  ...NATURAL_SUB_CLASSES,
  "unclassified",
];

export interface SubClassOption {
  value: "" | SubClass;
  label: string;
}

const SUB_CLASS_LABELS: Record<SubClass, string> = {
  industrial_fire: "Industrial Fire",
  gas_flare: "Gas Flare",
  mining_activity: "Mining Activity",
  forest_fire: "Forest Wildfire",
  agricultural_burning: "Agri Burning",
  other_natural: "Other Natural",
  unclassified: "Unclassified",
};

export function getConstrainedSubClasses(primaryClass: "" | PrimaryClass): SubClassOption[] {
  const allOption: SubClassOption = { value: "", label: "All Sub-Classes" };

  let options: SubClass[];
  if (primaryClass === "industrial") {
    options = INDUSTRIAL_SUB_CLASSES;
  } else if (primaryClass === "natural") {
    options = NATURAL_SUB_CLASSES;
  } else {
    options = ALL_SUB_CLASSES;
  }

  return [
    allOption,
    ...options.map((sc) => ({ value: sc, label: SUB_CLASS_LABELS[sc] })),
  ];
}

// ─── Date Computation ───────────────────────────────────────────────────────
function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export function computeDateRange(
  preset: TimePreset,
  customFrom: string | null,
  customTo: string | null
): { startDate?: string; endDate?: string } {
  if (preset === "all") return {};

  if (preset === "custom") {
    return {
      startDate: customFrom || undefined,
      endDate: customTo || undefined,
    };
  }

  const now = new Date();
  const end = formatDate(now);

  const daysMap: Record<string, number> = {
    "24h": 1,
    "7d": 7,
    "30d": 30,
    "90d": 90,
  };

  const days = daysMap[preset] || 30;
  const start = new Date(now);
  start.setDate(start.getDate() - days);

  return { startDate: formatDate(start), endDate: end };
}

// ─── Convert Filter State to API Params ─────────────────────────────────────
export function filtersToEventParams(
  state: GisFilterState,
  extraParams?: Partial<EventFilterParams>
): EventFilterParams {
  const dateRange = computeDateRange(state.dateRange, state.dateFrom, state.dateTo);

  const params: EventFilterParams = {
    ...extraParams,
    ...dateRange,
  };

  if (state.primaryClass) params.primary_class = state.primaryClass as PrimaryClass;
  if (state.subClass) params.sub_class = state.subClass as SubClass;
  if (state.minConfidence !== null) params.min_confidence = state.minConfidence;
  if (state.anomalyMode === "anomalous") params.is_anomalous = true;
  if (state.anomalyMode === "nominal") params.is_anomalous = false;
  if (state.state) params.state = state.state;
  if (state.district) params.district = state.district;

  return params;
}

export function filtersToFacilityParams(
  state: GisFilterState,
  extraParams?: Partial<FacilityFilterParams>
): FacilityFilterParams {
  const params: FacilityFilterParams = { ...extraParams };

  if (state.state) params.state = state.state;
  if (state.district) params.district = state.district;

  return params;
}

// ─── Active Filter Helpers ──────────────────────────────────────────────────
export function isFilterActive(state: GisFilterState): boolean {
  return countActiveFilters(state) > 0;
}

export function countActiveFilters(state: GisFilterState): number {
  let count = 0;
  if (state.dateRange !== "all") count++;
  if (state.primaryClass !== "") count++;
  if (state.subClass !== "") count++;
  if (state.minConfidence !== null) count++;
  if (state.anomalyMode !== "all") count++;
  if (state.state !== "") count++;
  if (state.district !== "") count++;
  return count;
}

export interface ActiveFilterDescriptor {
  key: keyof GisFilterState;
  label: string;
}

export function getActiveFilterDescriptors(state: GisFilterState): ActiveFilterDescriptor[] {
  const descriptors: ActiveFilterDescriptor[] = [];

  if (state.dateRange !== "all") {
    const preset = TIME_PRESETS.find((p) => p.value === state.dateRange);
    if (state.dateRange === "custom") {
      const parts = [state.dateFrom, state.dateTo].filter(Boolean).join(" → ");
      descriptors.push({ key: "dateRange", label: parts || "Custom Range" });
    } else {
      descriptors.push({ key: "dateRange", label: `Last ${preset?.label || state.dateRange}` });
    }
  }

  if (state.primaryClass) {
    descriptors.push({
      key: "primaryClass",
      label: state.primaryClass === "industrial" ? "Industrial" : "Natural",
    });
  }

  if (state.subClass) {
    descriptors.push({
      key: "subClass",
      label: SUB_CLASS_LABELS[state.subClass as SubClass] || state.subClass,
    });
  }

  if (state.minConfidence !== null) {
    descriptors.push({
      key: "minConfidence",
      label: `≥${Math.round(state.minConfidence * 100)}%`,
    });
  }

  if (state.anomalyMode !== "all") {
    descriptors.push({
      key: "anomalyMode",
      label: state.anomalyMode === "anomalous" ? "Anomalous Only" : "Nominal Only",
    });
  }

  if (state.state) {
    descriptors.push({ key: "state", label: state.state });
  }

  if (state.district) {
    descriptors.push({ key: "district", label: state.district });
  }

  return descriptors;
}

// ─── URL Serialization ──────────────────────────────────────────────────────
export function serializeToUrlParams(state: GisFilterState): string {
  const params = new URLSearchParams();

  if (state.dateRange !== "all") params.set("range", state.dateRange);
  if (state.dateRange === "custom" && state.dateFrom) params.set("from", state.dateFrom);
  if (state.dateRange === "custom" && state.dateTo) params.set("to", state.dateTo);
  if (state.primaryClass) params.set("primary", state.primaryClass);
  if (state.subClass) params.set("sub", state.subClass);
  if (state.minConfidence !== null) params.set("confidence", String(state.minConfidence));
  if (state.anomalyMode !== "all") params.set("anomaly", state.anomalyMode);
  if (state.state) params.set("state", state.state);
  if (state.district) params.set("district", state.district);

  return params.toString();
}

export function parseFromUrlParams(search: string): Partial<GisFilterState> {
  const params = new URLSearchParams(search);
  const result: Partial<GisFilterState> = {};

  const range = params.get("range");
  if (range && ["24h", "7d", "30d", "90d", "custom"].includes(range)) {
    result.dateRange = range as TimePreset;
  }

  const from = params.get("from");
  if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) result.dateFrom = from;

  const to = params.get("to");
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) result.dateTo = to;

  const primary = params.get("primary");
  if (primary && ["industrial", "natural"].includes(primary)) {
    result.primaryClass = primary as PrimaryClass;
  }

  const sub = params.get("sub");
  if (
    sub &&
    [
      "industrial_fire", "gas_flare", "mining_activity",
      "forest_fire", "agricultural_burning", "other_natural", "unclassified",
    ].includes(sub)
  ) {
    result.subClass = sub as SubClass;
  }

  const confidence = params.get("confidence");
  if (confidence) {
    const val = parseFloat(confidence);
    if (!isNaN(val) && val >= 0 && val <= 1) result.minConfidence = val;
  }

  const anomaly = params.get("anomaly");
  if (anomaly && ["anomalous", "nominal"].includes(anomaly)) {
    result.anomalyMode = anomaly as AnomalyMode;
  }

  const stateVal = params.get("state");
  if (stateVal) result.state = stateVal;

  const district = params.get("district");
  if (district) result.district = district;

  return result;
}

