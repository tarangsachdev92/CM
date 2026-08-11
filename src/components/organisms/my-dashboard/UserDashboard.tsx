// pages/UserDashboard.tsx
import GridLayout from "react-grid-layout";
import { widgetRegistry } from "../../organisms/widgets/registery";
import { DashboardItem } from "../../../types/common";
import { ReadonlyWidgetContainer } from "../widgets/ReadonlyWidgetContainer";


export const UserDashboard = () => {
  const items = loadLayout();

  return (
    <GridLayout      
      width={window.outerWidth}    
      gridConfig={{ cols: 12, rowHeight: 30 }}

    >
      {items.map(item => {

        if(!item) return null;
        if(!item.widgetType) return null;
        const widget = widgetRegistry[item.widgetType];

        if(!widget?.component) return null;

        const WidgetComponent = widget.component;

        return (
          <div key={item.i} data-grid={item}>
            <ReadonlyWidgetContainer>
              <WidgetComponent />
            </ReadonlyWidgetContainer>
          </div>
        );
      })}
    </GridLayout>
  );
};

const STORAGE_KEY = "dashboard-layout";

export const loadLayout = (): DashboardItem[] =>
  JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");