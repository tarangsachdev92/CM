import { Layout, LayoutItem, ReactGridLayout, noCompactor } from "react-grid-layout";
import { widgetRegistry, WIDGET_TYPE } from "../../components/organisms/widgets/registery";
import { WidgetContainer } from "../../components/organisms/widgets/WidgetContainer";
import { DashboardItem } from "../../types/common";
import { useState, useCallback, useMemo } from "react";
import LayoutNavbar from "../../components/molecules/navbar/LayoutNavbar";
import { useNavigate } from "react-router-dom";
import LayoutAddWidgetFlyout from "../../components/organisms/widgets/LayoutAddWidgetFlyout";


const STORAGE_KEY = "dashboard-layout";

export const UserLayout = () => {
  const [items, setItems] = useState<DashboardItem[]>(load());
  const [showAddFlyout, setShowAddFlyout] = useState(false);
  // const params = useParams(); 
  const navigate = useNavigate();

  const addWidgets = useCallback((types: string[]) => {
    const newItems: DashboardItem[] = types.flatMap(type => {
      const def = widgetRegistry[type];

      if (!def) return [];

      return [
        {
          i: crypto.randomUUID(),
          x: 0,
          y: Infinity,
          w: def.defaultSize.w,
          h: def.defaultSize.h,
          widgetType: type,
        },
      ];
    });

    if (!newItems.length) return;

    setItems(prev => [...prev, ...newItems]);
  }, []);
  const removeWidget = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.i !== id));
  }, []);

  const onLayoutChange = useCallback((layout: Layout) => {
    setItems(prev => {
      let hasChanges = false;

      const next = prev.map(item => {
        const updated = layout.find((entry: LayoutItem) => entry.i === item.i);

        if (!updated) return item;

        if (
          item.x === updated.x &&
          item.y === updated.y &&
          item.w === updated.w &&
          item.h === updated.h
        ) {
          return item;
        }

        hasChanges = true;
        return {
          ...item,
          x: updated.x,
          y: updated.y,
          w: updated.w,
          h: updated.h,
        };
      });

      return hasChanges ? next : prev;
    });
  }, []);

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    navigate('/my-dashboard')
  };

  const reset = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    setItems([]);
  };

  const renderedWidgets = useMemo(
    () =>
      items.map(item => {
        const def = widgetRegistry[item.widgetType];

        if (!def?.component) return null;

        const Widget = def.component;

        return (
          <div
            key={item.i}
            data-grid={{
              ...item,
              static: item.widgetType === WIDGET_TYPE.FAVOURITES,
            }}
          >
            <WidgetContainer
              title={def.title ?? ''}
              onRemove={() => removeWidget(item.i)}
              hideControls={showAddFlyout}
              disableMoveOverlay={item.widgetType === WIDGET_TYPE.FAVOURITES}
            >
              <Widget />
            </WidgetContainer>
          </div>
        );
      }),
    [items, removeWidget, showAddFlyout],
  );

  return (
    <>
      <LayoutNavbar
        saveHandler={save}
        resetHandler={reset}
        itemCount={items.length}
        addHandler={() => setShowAddFlyout(true)}
      />
      {/* <WidgetPicker onAdd={addWidget} /> */}

      <ReactGridLayout
        width={window.outerWidth}
        compactor={noCompactor}
        onLayoutChange={onLayoutChange}
        gridConfig={{ cols: 12, rowHeight: 30 }}
      >
        {renderedWidgets}
      </ReactGridLayout>

      <LayoutAddWidgetFlyout
        isOpen={showAddFlyout}
        onAdd={addWidgets}
        onClose={() => {
          setShowAddFlyout(false);
        }}
      />
    </>
  );
};

const load = (): DashboardItem[] =>
  JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
