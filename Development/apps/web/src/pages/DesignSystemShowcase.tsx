import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Button,
  IconButton,
  Card,
  GlassCard,
  Badge,
  StatusBadge,
  KpiCard,
  Input,
  Select,
  Tooltip,
  Modal,
  Drawer,
  Divider,
  Tabs,
  Progress,
  ConfidenceIndicator,
  Skeleton,
  EmptyState,
  ErrorState,
  LoadingState,
  SectionHeader,
} from "../components/ui";
import {
  Flame,
  Activity,
  Shield,
  Layers,
  Search,
  Radio,
  ExternalLink,
  Settings,
  Eye,
  CheckCircle,
} from "lucide-react";
import { staggerContainerVariants, fadeInVariants } from "../design-system/motion";

export const DesignSystemShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState("components");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectValue, setSelectValue] = useState("refinery");

  return (
    <div className="min-h-screen bg-void bg-tactical-grid text-text-primary px-4 py-8 sm:px-8 max-w-7xl mx-auto">
      {/* Top Banner / Hero */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainerVariants}
        className="mb-10"
      >
        <motion.div variants={fadeInVariants} className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-brand-orange/15 border border-brand-orange/30 text-brand-orange">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-text-primary tracking-tight">
                AgniDrishti Design System
              </h1>
              <Badge variant="brand" dot>
                D4.1 Verified
              </Badge>
            </div>
            <p className="text-xs font-mono uppercase tracking-widest text-text-muted mt-0.5">
              SIH26162 • AI-Powered Thermal Intelligence
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Tabs */}
      <div className="mb-8">
        <Tabs
          tabs={[
            { id: "components", label: "Components & Atoms", icon: <Layers className="w-4 h-4" /> },
            { id: "tokens", label: "Color Tokens & Palette", icon: <Radio className="w-4 h-4" /> },
            { id: "typography", label: "Typography System", icon: <Activity className="w-4 h-4" /> },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="pill"
        />
      </div>

      {activeTab === "components" && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainerVariants}
          className="space-y-12"
        >
          {/* Section 1: KPI Metric Cards */}
          <motion.section variants={fadeInVariants}>
            <SectionHeader
              title="1. Command Center KPI Cards"
              subtitle="High-density intelligence metric widgets with accent borders & trend vectors"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Thermal Anomalies (24h)"
                value="142"
                trend={{ value: "+12% vs 7d avg", isPositive: false }}
                icon={<Flame className="w-4 h-4 text-brand-orange" />}
                accent="orange"
                sublabel="NASA FIRMS NRT Feed"
              />
              <KpiCard
                label="Industrial Facilities"
                value="2,481"
                trend={{ value: "+8 newly mapped", isPositive: true }}
                icon={<Layers className="w-4 h-4 text-intelligence-cyan" />}
                accent="cyan"
                sublabel="OpenStreetMap Layer"
              />
              <KpiCard
                label="Active Threat Alerts"
                value="3"
                trend={{ value: "2 unacknowledged", isPositive: false }}
                icon={<Shield className="w-4 h-4 text-status-critical" />}
                accent="critical"
                sublabel="Refinery & Flare Triggers"
              />
              <KpiCard
                label="AI Model Confidence"
                value="94.8%"
                trend={{ value: "v2.0 Ensembled", isPositive: true }}
                icon={<Activity className="w-4 h-4 text-status-success" />}
                accent="none"
                sublabel="Land-Cover + Recurrence"
              />
            </div>
          </motion.section>

          {/* Section 2: Buttons & Actions */}
          <motion.section variants={fadeInVariants}>
            <SectionHeader
              title="2. Buttons & Icon Actions"
              subtitle="Tactical action triggers with primary, secondary, cyan, ghost, outline, and danger variants"
            />
            <Card className="p-6 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" leftIcon={<Flame className="w-4 h-4" />}>
                  Primary Action
                </Button>
                <Button variant="cyan" leftIcon={<Radio className="w-4 h-4" />}>
                  Cyan Intel Action
                </Button>
                <Button variant="secondary" leftIcon={<Layers className="w-4 h-4" />}>
                  Secondary
                </Button>
                <Button variant="outline" rightIcon={<ExternalLink className="w-4 h-4" />}>
                  Outline
                </Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="danger">Critical Action</Button>
                <Button variant="primary" isLoading>
                  Loading
                </Button>
                <Button variant="secondary" disabled>
                  Disabled
                </Button>
              </div>

              <Divider label="Button Sizes & Icon Buttons" />

              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm" variant="secondary">
                  Small Button (32px)
                </Button>
                <Button size="md" variant="secondary">
                  Medium Button (40px)
                </Button>
                <Button size="lg" variant="secondary">
                  Large Button (48px)
                </Button>
                <div className="h-6 w-[1px] bg-border-subtle mx-2" />
                <IconButton
                  icon={<Search className="w-4 h-4" />}
                  aria-label="Search"
                  variant="secondary"
                  size="sm"
                />
                <IconButton
                  icon={<Settings className="w-4 h-4" />}
                  aria-label="Settings"
                  variant="primary"
                  size="md"
                />
                <IconButton
                  icon={<Flame className="w-5 h-5" />}
                  aria-label="Fire alert"
                  variant="cyan"
                  size="lg"
                />
                <IconButton
                  icon={<Eye className="w-4 h-4" />}
                  aria-label="View"
                  variant="ghost"
                  size="md"
                />
              </div>
            </Card>
          </motion.section>

          {/* Section 3: Badges, Status & AI Confidence */}
          <motion.section variants={fadeInVariants}>
            <SectionHeader
              title="3. Badges, Domain Statuses & AI Confidence"
              subtitle="Standardized classification pills and micro-meter confidence indicators"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-5 space-y-4">
                <h4 className="text-xs uppercase font-mono text-text-secondary font-semibold">
                  Semantic & Domain Status Badges
                </h4>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status="industrial_fire" />
                  <StatusBadge status="gas_flare" />
                  <StatusBadge status="forest_fire" />
                  <StatusBadge status="agricultural_burning" />
                  <StatusBadge status="mining_activity" />
                  <StatusBadge status="anomalous" />
                  <StatusBadge status="nominal" />
                  <StatusBadge status="acknowledged" />
                  <StatusBadge status="resolved" />
                </div>
                <Divider />
                <h4 className="text-xs uppercase font-mono text-text-secondary font-semibold">
                  Palette Variants
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="brand" dot>Brand Orange</Badge>
                  <Badge variant="cyan" dot>Intelligence Cyan</Badge>
                  <Badge variant="critical" dot>Critical Threat</Badge>
                  <Badge variant="warning" dot>Warning</Badge>
                  <Badge variant="success" dot>Success</Badge>
                  <Badge variant="info" dot>Info Feed</Badge>
                </div>
              </Card>

              <Card className="p-5 space-y-4">
                <h4 className="text-xs uppercase font-mono text-text-secondary font-semibold">
                  AI Model Confidence Indicators
                </h4>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-text-secondary">High Confidence (≥80%):</span>
                    <ConfidenceIndicator score={0.945} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-text-secondary">Moderate (60-79%):</span>
                    <ConfidenceIndicator score={0.72} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-text-secondary">Low Confidence (&lt;60%):</span>
                    <ConfidenceIndicator score={0.41} />
                  </div>
                </div>
                <Divider label="Progress Indicators" />
                <div className="space-y-3">
                  <Progress value={78} variant="brand" showLabel />
                  <Progress value={92} variant="cyan" size="sm" />
                </div>
              </Card>
            </div>
          </motion.section>

          {/* Section 4: Glass Cards & Form Inputs */}
          <motion.section variants={fadeInVariants}>
            <SectionHeader
              title="4. Tactical Form Inputs & Glass Surfaces"
              subtitle="Data collection controls, select menus, and backdrop-blur glass containers"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-5 space-y-4">
                <h4 className="text-xs uppercase font-mono text-text-secondary font-semibold">
                  Form Controls
                </h4>
                <Input
                  label="SEARCH INDUSTRIAL REGION"
                  placeholder="e.g., Jamnagar, Gujarat..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
                <Select
                  label="FACILITY TAXONOMY FILTER"
                  value={selectValue}
                  onChange={(e) => setSelectValue(e.target.value)}
                  options={[
                    { value: "refinery", label: "Oil Refinery (works=oil)" },
                    { value: "petrochemical", label: "Petrochemical Complex" },
                    { value: "power_plant", label: "Thermal Power Station" },
                    { value: "steel", label: "Steel & Metallurgy Works" },
                    { value: "mining", label: "Mining & Coalfields" },
                    { value: "lng_terminal", label: "LNG Terminal / Gas Storage" },
                  ]}
                />
                <Input
                  label="INPUT ERROR STATE EXAMPLE"
                  placeholder="Invalid coordinates"
                  defaultValue="999.99, 999.99"
                  error="Coordinates must fall within valid geographic bounds (-90 to 90 lat)"
                />
              </Card>

              <div className="space-y-4">
                <GlassCard glow="orange">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-semibold uppercase text-brand-amber">
                      GlassCard (Brand Glow)
                    </span>
                    <Tooltip content="Tooltip showing facility telemetry info">
                      <span className="text-xs text-text-muted hover:text-text-primary cursor-help">
                        ℹ️ Info Hover
                      </span>
                    </Tooltip>
                  </div>
                  <p className="text-xs text-text-secondary">
                    Backdrop-blur container engineered for overlay inspection panels on top of satellite imagery.
                  </p>
                </GlassCard>

                <GlassCard glow="cyan">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-semibold uppercase text-intelligence-cyan">
                      GlassCard (Intelligence Glow)
                    </span>
                    <Badge variant="cyan" size="sm">
                      Active Stream
                    </Badge>
                  </div>
                  <p className="text-xs text-text-secondary">
                    Used for AI classification badges, spatial anomaly scores, and satellite spectral readings.
                  </p>
                </GlassCard>
              </div>
            </div>
          </motion.section>

          {/* Section 5: State Demonstrations & Modals */}
          <motion.section variants={fadeInVariants}>
            <SectionHeader
              title="5. State Views & Overlays"
              subtitle="Loading skeletons, empty views, telemetry error states, and interactive dialogs"
              actions={
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setIsModalOpen(true)}>
                    Trigger Modal
                  </Button>
                  <Button size="sm" variant="cyan" onClick={() => setIsDrawerOpen(true)}>
                    Trigger Drawer
                  </Button>
                </div>
              }
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs uppercase font-mono text-text-secondary mb-3 font-semibold">
                    Skeleton Placeholder
                  </h4>
                  <div className="space-y-2.5">
                    <Skeleton variant="rectangular" height={32} />
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="text" width="60%" />
                  </div>
                </div>
                <p className="text-[11px] text-text-muted mt-4">Simulates loading table rows</p>
              </Card>

              <Card className="p-4">
                <EmptyState
                  title="No Hotspots Found"
                  description="No thermal detections found within the selected 50km radius."
                  action={
                    <Button size="sm" variant="secondary">
                      Expand Search Bounding Box
                    </Button>
                  }
                />
              </Card>

              <Card className="p-4">
                <ErrorState
                  title="Feed Disconnected"
                  message="Overpass API rate limit reached (HTTP 429)."
                  onRetry={() => alert("Retrying connection...")}
                />
              </Card>
            </div>
          </motion.section>
        </motion.div>
      )}

      {activeTab === "tokens" && (
        <div className="space-y-8">
          <SectionHeader
            title="Design Token Palette"
            subtitle="Strict hex values mapped directly to Tailwind CSS and TypeScript token system"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Backgrounds */}
            <Card className="p-5 space-y-3">
              <h4 className="text-xs font-mono uppercase text-text-secondary font-semibold">
                Background Tokens
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded bg-void border border-border-subtle">
                  <span className="text-xs font-mono">void (#07090C)</span>
                  <div className="w-6 h-6 rounded bg-void border border-border-normal" />
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-base border border-border-subtle">
                  <span className="text-xs font-mono">base (#0B0F14)</span>
                  <div className="w-6 h-6 rounded bg-base border border-border-normal" />
                </div>
              </div>
            </Card>

            {/* Surfaces */}
            <Card className="p-5 space-y-3">
              <h4 className="text-xs font-mono uppercase text-text-secondary font-semibold">
                Surface Tokens
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded bg-surface border border-border-subtle">
                  <span className="text-xs font-mono">surface (#10151C)</span>
                  <div className="w-6 h-6 rounded bg-surface border border-border-normal" />
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-surface-2 border border-border-subtle">
                  <span className="text-xs font-mono">surface-2 (#151B23)</span>
                  <div className="w-6 h-6 rounded bg-surface-2 border border-border-normal" />
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-surface-3 border border-border-subtle">
                  <span className="text-xs font-mono">surface-3 (#1B222C)</span>
                  <div className="w-6 h-6 rounded bg-surface-3 border border-border-normal" />
                </div>
              </div>
            </Card>

            {/* Brand & Intel */}
            <Card className="p-5 space-y-3">
              <h4 className="text-xs font-mono uppercase text-text-secondary font-semibold">
                Brand & Intelligence
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded bg-surface-2 border border-border-subtle">
                  <span className="text-xs font-mono text-brand-orange">orange (#FF7A18)</span>
                  <div className="w-6 h-6 rounded bg-brand-orange" />
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-surface-2 border border-border-subtle">
                  <span className="text-xs font-mono text-brand-amber">amber (#FFB547)</span>
                  <div className="w-6 h-6 rounded bg-brand-amber" />
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-surface-2 border border-border-subtle">
                  <span className="text-xs font-mono text-intelligence-cyan">cyan (#31C7D4)</span>
                  <div className="w-6 h-6 rounded bg-intelligence-cyan" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "typography" && (
        <div className="space-y-8">
          <SectionHeader
            title="Typography Hierarchy"
            subtitle="Space Grotesk for cinematic display headers and Inter for data-dense telemetry UI"
          />

          <Card className="p-6 space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-mono text-text-muted">Display 1 (Space Grotesk 32px / Bold)</span>
              <h1 className="text-3xl font-display font-bold text-text-primary">
                AgniDrishti: AI-Powered Thermal Intelligence
              </h1>
            </div>

            <Divider />

            <div className="space-y-2">
              <span className="text-xs font-mono text-text-muted">Heading 2 (Space Grotesk 20px / SemiBold)</span>
              <h2 className="text-xl font-display font-semibold text-text-primary">
                Jamnagar Refinery Thermal Persistence Monitoring
              </h2>
            </div>

            <Divider />

            <div className="space-y-2">
              <span className="text-xs font-mono text-text-muted">Body Text (Inter 14px / Regular)</span>
              <p className="text-sm text-text-secondary leading-relaxed max-w-2xl">
                Thermal source classification utilizes multi-spectral VIIRS and MODIS brightness telemetry cross-referenced against high-resolution OpenStreetMap industrial geometries and historical rolling FRP baselines.
              </p>
            </div>

            <Divider />

            <div className="space-y-2">
              <span className="text-xs font-mono text-text-muted">Monospace / Coordinates (JetBrains Mono 12px)</span>
              <p className="text-xs font-mono text-intelligence-cyan">
                LAT: 22.35561° N • LON: 69.85192° E • FRP: 142.6 MW • TEMP: 345.8 K
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Interactive Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Thermal Anomaly Detail Inspection"
        description="Event ID: e0000000-0000-0000-0000-000000000001"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Dismiss
            </Button>
            <Button variant="primary" leftIcon={<CheckCircle className="w-4 h-4" />}>
              Acknowledge Alert
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between p-3 rounded bg-surface-2 border border-border-subtle">
            <span className="text-xs font-mono text-text-secondary">Primary Class</span>
            <Badge variant="brand">Industrial</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded bg-surface-2 border border-border-subtle">
            <span className="text-xs font-mono text-text-secondary">Sub Classification</span>
            <StatusBadge status="gas_flare" />
          </div>
          <div className="flex items-center justify-between p-3 rounded bg-surface-2 border border-border-subtle">
            <span className="text-xs font-mono text-text-secondary">Confidence</span>
            <ConfidenceIndicator score={0.92} />
          </div>
        </div>
      </Modal>

      {/* Interactive Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Facility Telemetry Sidebar"
        description="Reliance Jamnagar Refinery • 7,500 MW Capacity"
        footer={
          <Button variant="cyan" className="w-full" onClick={() => setIsDrawerOpen(false)}>
            Export Inspection Dossier
          </Button>
        }
      >
        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase text-text-secondary font-semibold">
              Historical Anomaly Trend
            </span>
            <Progress value={85} variant="brand" showLabel />
          </div>
          <Divider />
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase text-text-secondary font-semibold">
              Live Sensor Ingestion
            </span>
            <LoadingState label="Polling VIIRS NRT Feed..." />
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default DesignSystemShowcase;

