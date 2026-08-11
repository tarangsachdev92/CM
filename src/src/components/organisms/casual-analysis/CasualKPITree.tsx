import React, { memo, useMemo, useState, useEffect } from 'react';
import dagre from 'dagre';

import {
    ReactFlow,
    Background,
    Controls,
    Node,
    Edge,
    Position,
    Handle,
    BaseEdge,
    EdgeProps,
    getSmoothStepPath,
    ReactFlowProvider,
    useReactFlow,
} from '@xyflow/react';

import { Button, Flyout, Icon } from 'konnect-react-components';
import '@xyflow/react/dist/style.css';
import styles from './CasualKPITree.module.scss';

/* =========================================================
   TYPES
========================================================= */

export type KPINodeData = {
    id: string;
    name: string;
    value: string;
    target: string;
    status: 'good' | 'bad';
    children?: KPINodeData[];
};

type Props = {
    data: KPINodeData | null;
};

const NODE_WIDTH = 190;
const NODE_HEIGHT = 95;

/* =========================================================
   NODE
========================================================= */

const CustomNode = memo(({ data }: any) => {
    const [hovered, setHovered] = useState(false);

    const style = data.isSelected
        ? { background: '#E8F0FE', border: '1px solid #2563EB' }
        : hovered && data.isRoot
          ? { background: '#F9FAFB', border: '1px solid #2563EB' }
          : { background: '#FFF', border: '1px solid #E5E7EB' };

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                minWidth: NODE_WIDTH,
                padding: 12,
                borderRadius: 8,
                cursor: data.isRoot ? 'pointer' : 'default',
                boxShadow: '0 2px 5px rgba(0,0,0,0.06)',
                userSelect: 'none',
                ...style,
            }}
        >
            <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />

            <div style={{ fontWeight: 600, marginBottom: 8 }}>
                {data.label} <span className={styles.kpiText}>(%)</span>
            </div>

            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                <div
                    className={`${styles.nodeValue} ${
                        data.status === 'bad' ? styles.bad : styles.good
                    }`}
                >
                    {data.value}
                </div>

                <div style={{ fontSize: 12, marginBottom: 3 }}>
                    <Icon name="target-icon-grey" size="m" color="neutrals-B100" /> {data.target}
                </div>
            </div>
        </div>
    );
});

const nodeTypes = { custom: CustomNode };

/* =========================================================
   EDGE
========================================================= */

const KPIEdge = (props: EdgeProps) => {
    const [path] = getSmoothStepPath({
        ...props,
        borderRadius: 18,
        offset: 20,
    });

    return <BaseEdge {...props} path={path} style={{ stroke: '#D1D5DB', strokeWidth: 1.5 }} />;
};

const edgeTypes = { kpi: KPIEdge };

/* =========================================================
   LAYOUT
========================================================= */

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));

    g.setGraph({
        rankdir: 'TB',
        nodesep: 110,
        ranksep: 130,
    });

    nodes.forEach(n =>
        g.setNode(n.id, {
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
        }),
    );

    edges.forEach(e => g.setEdge(e.source, e.target));

    dagre.layout(g);

    return {
        nodes: nodes.map(n => {
            const p = g.node(n.id);

            return {
                ...n,
                position: {
                    x: p.x - NODE_WIDTH / 2,
                    y: p.y - NODE_HEIGHT / 2,
                },
            };
        }),
        edges,
    };
};

/* =========================================================
   FLOW CONTENT
========================================================= */

const FlowContent = ({ data, onOpen }: any) => {
    const { fitView } = useReactFlow();
    const [selected, setSelected] = useState<string | null>(null);

    const flowData = useMemo(() => {
        const n: Node[] = [];
        const e: Edge[] = [];

        const walk = (node: KPINodeData, parent: string | null) => {
            n.push({
                id: node.id,
                type: 'custom',
                data: {
                    label: node.name,
                    value: node.value,
                    target: node.target,
                    status: node.status,
                    isRoot: parent === null,
                    isSelected: selected === node.id,
                },
                position: { x: 0, y: 0 },
                draggable: false,
                selectable: false,
            });

            if (parent) {
                e.push({
                    id: `${parent}-${node.id}`,
                    source: parent,
                    target: node.id,
                    type: 'kpi',
                });
            }

            node.children?.forEach(c => walk(c, node.id));
        };

        walk(data, null);

        return getLayoutedElements(n, e);
    }, [data, selected]);

    // ✅ Fit view after nodes render
    // useEffect(() => {
    //     if (flowData.nodes.length) {
    //         const t = setTimeout(() => {
    //             fitView({ padding: 0.25, duration: 500 });
    //         }, 300);
    //         return () => clearTimeout(t);
    //     }
    // }, [flowData.nodes.length, fitView]);
    useEffect(() => {
        if (!flowData.nodes.length) return;

        const t = setTimeout(() => {
            fitView({ padding: 0.25, duration: 500 });
        }, 300);

        return () => clearTimeout(t);
    }, [flowData.nodes.length, fitView]);

    return (
        <ReactFlow
            nodes={flowData.nodes}
            edges={flowData.edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            minZoom={0.5}
            maxZoom={1.5}
            nodesDraggable={false}
            elementsSelectable={false}
            fitView={false}
            proOptions={{ hideAttribution: true }}
            onNodeClick={(_, node) => {
                if (!node.data.isRoot) return;
                setSelected(node.id);
                onOpen();
            }}
        >
            <Background />
            <Controls position="bottom-right" />
        </ReactFlow>
    );
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const CasualKPITree: React.FC<Props> = ({ data }) => {
    const [open, setOpen] = useState(false);

    if (!data) return null;

    const kpiName = data.name?.replace(' (%)', '') || '';

    return (
        <div
            style={{
                width: '100%',
                height: 700,
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                overflow: 'hidden',
                background: '#FFF',
            }}
        >
            {/* ✅ HEADER */}
            <div
                style={{
                    padding: '16px 20px',
                    // borderBottom: '1px solid #E5E7EB',
                    background: '#F9FAFB',
                }}
            >
                <div style={{ fontSize: 16, fontWeight: 600 }}>{kpiName} KPI Tree</div>

                <div
                    style={{
                        fontSize: 12,
                        color: '#6B7280',
                        marginTop: 4,
                    }}
                >
                    This model is trained using 1 full years data
                </div>
            </div>

            {/* ✅ TREE SECTION */}
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    background: '#F9FAFB',
                }}
            >
                <div style={{ flex: 1, height: '100%' }}>
                    <ReactFlowProvider>
                        <FlowContent data={data} onOpen={() => setOpen(true)} />
                    </ReactFlowProvider>
                </div>

                {/* <Flyout
                    flyoutOpen={open}
                    cancelIconClick={() => setOpen(false)}
                    direction="right"
                    heading=""
                    content={<div style={{ padding: 20 }}>Flyout Content</div>}
                /> */}

                <Flyout
                    flyoutOpen={open}
                    cancelIconClick={() => setOpen(false)}
                    direction="right"
                    heading=""
                    content={
                        <div className={styles.flyoutWrapper}>
                            {/* ================= HEADER ================= */}
                            <div className={styles.flyoutHeader}>
                                <div>
                                    <div className={styles.flyoutTitle}>{kpiName}</div>
                                    <div className={styles.flyoutSubtitle}>
                                        View metric details and run analysis
                                    </div>
                                </div>

                                <Button
                                    icon="x-circle"
                                    onClick={() => setOpen(false)}
                                    variant="Subtle"
                                    iconSize="Large"
                                    size="L"
                                />
                            </div>

                            {/* ================= ACCORDION ================= */}
                            <div className={styles.flyoutSection}>
                                <div className={styles.accordionHeader}>
                                    <span>Causal Effect</span>
                                    <Icon name="chevron-down" size="m" />
                                </div>

                                <div className={styles.accordionSubtext}>
                                    This model is trained using 1 full years data
                                </div>
                            </div>

                            {/* ================= ANALYSIS TYPE ================= */}
                            <div className={styles.flyoutSection}>
                                <div className={styles.analysisTitle}>Choose analysis type:</div>

                                <div className={styles.analysisSubtitle}>
                                    What would you like to analyse today?
                                </div>

                                <div className={styles.analysisCard}>
                                    {/* ACTIVE */}
                                    <div className={styles.analysisItemActive}>
                                        <Icon name="data-flow-03" size="m" />
                                        <span>What-if Analysis</span>
                                    </div>

                                    <div className={styles.divider} />

                                    {/* DISABLED */}
                                    <div className={styles.analysisItemDisabled}>
                                        <Icon name="data-flow-04" size="m" />
                                        <span>Root Cause Analysis</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    }
                />
            </div>
        </div>
    );
};

export default CasualKPITree;
