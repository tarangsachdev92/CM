import { Dialog,Status,TextArea} from 'konnect-react-components';
import {   useMemo, useState } from 'react';
import { Label } from '../../atoms';
import styles from './ForumApproval.module.scss'
import { useDispatch } from 'react-redux';
import type {  AppDispatch } from '../../../store';
import { IRequestApproval } from '../../../types/response';
import { saveRequestApprovalStatus } from '../../../store/thunks/forumApproval';

type IForumRequestProps={
    isOpen:boolean;
    handleClose:(state:boolean)=> void,
    requestData:IRequestApproval,
}

enum ApprovalStatus{
    Approved=1,
    Pending=2,
    Rejected=3
} 

function ForumApproval({ isOpen, handleClose,requestData }: IForumRequestProps) {   
      const[isApproveOpen,setIsApproveOpen]=useState(false);
      const[isRejectOpen,setIsRejectOpen]=useState(false);
      const[comment,setComment]=useState("");
      const dispatch = useDispatch<AppDispatch>();
      const[isButtonHidden,setIsButtonHidden]=useState(true);
  
        const RequestDialogueContent = useMemo(() => {
        
            setComment(requestData.decisionComment ?? "");
            if(requestData.status ==="Pending"){
                setIsButtonHidden(false);
            }
            else{
                setIsButtonHidden(true);
            }
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}> 
                    <Status
                        size="S"
                        text={requestData.status}
                        type={requestData.status === 'Pending' ? 'Alert' : requestData.status === 'Approved'  ? 'Success' : 'Warning'}
                    />
                    <div className='sub-div'>
                    <Label type="body1">
                            <span className={styles['rm-card-title']}>Forum Name</span>
                        </Label>
                        <Label type="body2">
                            <span className={styles['rm-card-description']}>
                            {requestData.forumName}
                            </span>
                        </Label>
                        </div>
                    <div className='sub-div'>
                        <Label type="body1">
                            <span className={styles['rm-card-title']}>Requested Persona</span>
                        </Label>
                        <Label type="body2">
                            <span className={styles['rm-card-description']}>
                            {requestData.requestedPersona}
                            </span>
                        </Label>
                    </div>
                    <div className='sub-div'>
                        <Label type="body1">
                            <span className={styles['rm-card-title']}>Requested Via</span>
                        </Label>
                        <Label type="body2">
                            <span className={styles['rm-card-description']}>
                            {requestData.requestedVia}
                            </span>
                        </Label>
                    </div>
                    <div className='sub-div'>
                        <Label type="body1">
                            <span className={styles['rm-card-title']}>Reason for Request</span>
                        </Label>
                        <Label type="body2">
                            <span className={styles['rm-card-description']}>
                            {requestData.reasonForRequest}
                            </span>
                        </Label>
                    </div>
                    <div className='sub-div'>
                        {requestData.status ==="Pending" ? 
                    
                    <div>
                        <TextArea
                            customheight={20}
                            label="Comment"
                            maxCharacters={500}
                            placeholder="Enter here"
                            required
                            onChange={(e)=>{console.log(e); setComment(e.target.value); }}
                            />
                            </div>
                            :
                            <div >
                        <Label type="body1">
                            <span className={styles['rm-card-title']}>Comment</span>
                        </Label>
                        <Label type="body2">
                            <span className={styles['rm-card-description']}>
                            {requestData.decisionComment}
                            </span>
                        </Label>
                    </div>
                        }
                    </div>
                </div>
            );
          }, []);

    const UpdateRequestStatus = ((requestId:number,status:number,comment:string)=>{
                 dispatch(saveRequestApprovalStatus({requestId:requestId,approvalStatus:status,comment:comment}));
            handleClose(false);
            });

    return (
        <div>
            {/* Main dialog */}
        <Dialog
            isOpen={isOpen}
            content={RequestDialogueContent}
            onClose={() => {
                handleClose(false);
            }}
            title="Forum Access Request"
            primaryButtonText="Approve"
            onPrimaryButtonClick={() => {
                setIsApproveOpen(true);
            }}
            secondaryButtonText="Reject"
            onSecondaryButtonClick={() => {
                setIsRejectOpen(true);
            }}
            // size="Medium"
            isPrimaryDisabled={!comment.trim()}
            isSecondaryDisabled={!comment.trim()}
            hidePrimaryButton={isButtonHidden}
            hideSecondaryButton={isButtonHidden}
        ></Dialog>

        {/* Approve Dialog */}
         <Dialog
            isOpen={isApproveOpen}
            content="Are you sure you want to approve this request?"
            onClose={() => {
                setIsApproveOpen(false);
            }}
            title="Confirm Approval"
            primaryButtonText="Yes,Approve"
            onPrimaryButtonClick={() => {
            //    setStatus(ApprovalStatus.Approved);
                UpdateRequestStatus(requestData.requestId,ApprovalStatus.Approved,comment);
                setIsApproveOpen(false);
            }}
            secondaryButtonText="Cancel"
            onSecondaryButtonClick={() => {
                setIsApproveOpen(false);
            }} 
        ></Dialog>

        {/* Reject dialog */}
        <Dialog
            isOpen={isRejectOpen}
            content="Are you sure you want to reject this request?"
            onClose={() => {
                setIsApproveOpen(false);
            }}
            title="Confirm Rejection"
            primaryButtonText="Yes,Reject"
            onPrimaryButtonClick={() => {
            UpdateRequestStatus(requestData.requestId,ApprovalStatus.Rejected,comment);
                  setIsApproveOpen(false);
            }}
            secondaryButtonText="Cancel"
            onSecondaryButtonClick={() => {
                setIsRejectOpen(false);
            }} 
        ></Dialog>
    </div>
    );
}

export default ForumApproval;
