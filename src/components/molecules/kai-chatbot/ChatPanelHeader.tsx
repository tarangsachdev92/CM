import { Flex } from "antd"
import { IconButton } from "konnect-react-components"

type props ={
    showHistory:boolean,
    onHistoryClick:(toggle:boolean)=> void,
    fullScreen:boolean,
    onFullScreenClick:(toggle:boolean)=> void,
    onCloseClick:(toggle:boolean)=>void;
}

function ChatPanelHeader({showHistory,onCloseClick,fullScreen,onFullScreenClick,onHistoryClick}:props) {
  return (
      <Flex justify="space-between">
          <Flex gap={5}>
              {!showHistory && <IconButton icon="book-closed" onClick={() => {onHistoryClick(true)}} size="Small" />} 
              {!fullScreen && <IconButton icon="maximize-01" onClick={() => {onFullScreenClick(true);onHistoryClick(true)}} size="Small" />}  
              {fullScreen && <IconButton icon="minimize-01" onClick={() => {onFullScreenClick(false)}} size="Small" />}  
              
          </Flex>
          <Flex gap={5}>
              <IconButton icon="dots-vertical" onClick={() => {}} size="Small" />
              <IconButton icon="x-close" onClick={() => {onCloseClick(false)}} size="Small" />
          </Flex>
      </Flex>
  );
}

export default ChatPanelHeader