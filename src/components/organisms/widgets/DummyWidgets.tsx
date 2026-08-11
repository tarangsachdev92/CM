const boxStyle = {
  height: "100%",
  // padding: "12px",
  fontSize: "14px",
  background: "#fafafa",
  borderRadius: "4px",
};

export const WidgetOne = () => (
  <div style={boxStyle}>
    <img src="/layout-widget-thumbnails/widget-01.png" style={{objectFit:'fill',width:'100%',height:'100%',marginBottom:'10px'}}></img></div>
);

export const WidgetTwo = () => (
  <div style={boxStyle}>
    <img src="/layout-widget-thumbnails/widget-02.png" style={{objectFit:'fill',width:'100%',height:'100%'}}></img>
  </div>
);

export const WidgetThree = () => (
   <div style={boxStyle}>
    <img src="/layout-widget-thumbnails/widget-03.png" style={{objectFit:'fill',width:'100%',height:'100%'}}></img>
  </div>
);

export const WidgetFour = () => (
  <div style={boxStyle}>
    <img src="/layout-widget-thumbnails/widget-04.png" style={{objectFit:'fill',width:'100%',height:'100%'}}></img>
  </div>
);

export const WidgetFive = () => (
 <div style={boxStyle}>
    <img src="/layout-widget-thumbnails/widget-05.png" style={{objectFit:'fill',width:'100%',height:'100%'}}></img>
  </div>
);

export const WidgetSix = () => (
 <div style={boxStyle}>
    <img src="/layout-widget-thumbnails/widget-06.png" style={{objectFit:'fill',width:'100%',height:'100%'}}></img>
  </div>
);

export const WidgetSeven = () => (
  <div style={boxStyle}>Widget Seven: Messages</div>
);

export const WidgetEight = () => (
  <div style={boxStyle}>Widget Eight: System status</div>
);

export const WidgetNine = () => (
  <div style={boxStyle}>Widget Nine: Logs</div>
);

export const WidgetTen = () => (
  <div style={boxStyle}>Widget Ten: Notes</div>
);
