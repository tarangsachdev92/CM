import { Button } from "konnect-react-components";
import { widgetRegistry } from "./registery";

export const WidgetPicker = ({ onAdd }: { onAdd: (type: string) => void }) => (
  <div>
    {Object.values(widgetRegistry).map(w => (
      <Button key={w.type} onClick={() => onAdd(w.type)} variant="Secondary" size="S" text={w.title}/>              
    ))}
  </div>
);
