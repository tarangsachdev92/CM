import ReactQuill from "react-quill";
import 'react-quill/dist/quill.snow.css';

type Props={
    CurrentValue?:string|null;
    handleChange:(updatedHtml: string)=> void
}

function CustomRichTextEditor({CurrentValue,handleChange}:Props) {    
        
    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }, 'bold', 'underline', { 'list': 'bullet' }, { 'list': 'ordered' }, 'link', 'image']],        
    };
    

    return <ReactQuill className='quillEditor' modules={modules} theme="snow" value={CurrentValue??''} onChange={handleChange} />;
}

export default CustomRichTextEditor