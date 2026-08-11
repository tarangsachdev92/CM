
import { TextEditor } from "konnect-react-components";

type TextEditorProps = {
  value: string;
  onChange: (newValue: string) => void;
};

const CustomTextEditor = ({ value, onChange }: TextEditorProps) => {
  return (
    <TextEditor
      editorId='TextEditor'
      defaultValue={value}
      getContentRef={() => { }}
      placeholder="Start typing..."
      setContentRef={() => { }}
      onChange={onChange} // Use onChange instead of handleChange
    />
  );
};

export default CustomTextEditor;