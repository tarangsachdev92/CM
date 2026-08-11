import { useCallback, useRef, useState,useMemo,useEffect } from 'react';
import { Flex,Card } from 'antd';
import { Table,  Status,AnimatedLoaders} from 'konnect-react-components';
import styles from './UserProfileSettingsApprovalsSections.module.scss';
import { Label } from '../../atoms';
import { IRequestApproval } from '../../../types/response';
import { UserProfileSettingsPrimaryRoleNew } from '../../../assets/images/images';
import ForumApproval from '../../molecules/user-profile-settings-approvals-overlay/ForumApproval'
import { useDispatch } from 'react-redux';
import type {  AppDispatch } from '../../../store';
import { fetchForumApprovalDetails } from '../../../store/thunks/forumApproval';
 
function ApprovalSection(){
 
    const[loading,setLoading]=useState(true);
    const tableRef = useRef<any>(null);
    const[isOpen,setIsOpen]=useState(false);
    const[selectedRowData,setSelectedRowData]=useState<IRequestApproval>();
    const dispatch = useDispatch<AppDispatch>();
    const[approvalList,setApprovalList]=useState<IRequestApproval[]>();
 
      const fetchForumApproval = (()=>{
            dispatch(fetchForumApprovalDetails()).then((result:any)=>
                {
                    setApprovalList(result.payload);
                    setLoading(false);
                });
            });
   
    useEffect(() => {
          fetchForumApproval();
      }, [isOpen]);
 
    const renderColumns = useMemo(() => {
            return [
                {
                    key: 'requestType',
                    dataIndex: 'requestType' as keyof IRequestApproval,
                    title: 'Request Type',
                    width: '260px',
                    sortable: true,
                    resizable: true,
                    render: (requestType: string) => (
                            <span>{requestType}</span>
                    ),
                },
                {
                    key: 'requestedBy',
                    dataIndex: 'requestedBy' as keyof IRequestApproval,
                    title: 'Requested By',
                    width: '180px',
                    sortable: true,
                    resizable: true,
                     render: (_: any, record: IRequestApproval) => (
                                        <Flex gap={4} justify="space-between">
                                            <Flex vertical gap={1}>
                                                <Label type="body3">
                                                    {record.requesterFullName}
                                                </Label>
                                                <Label type="body4">
                                                      <span className={styles['description-text']}>   {record.roleName}</span>
                                                </Label>
                                            </Flex>
                                        </Flex>
                             ),
                },
                {
                    key: 'requestedOn',
                    dataIndex: 'requestedOn' as keyof IRequestApproval,
                    title: 'Requested On',
                    width: '200px',
                    sortable: true,
                    resizable: true,
                    render: (value: string) => value?.split("T")[0],
                },
                {
                    key: 'status',
                    dataIndex: 'status' as keyof IRequestApproval,
                    title: 'Status',
                    width: '140px',
                    sortable: true,
                    resizable: true,
                    render: (status: string,data:any) => (
                   <div onClick={()=>{setSelectedRowData(data);
                    setIsOpen(true);
                   }}>    
                    <Status
                        size="S"
                        text={status === 'Pending' ? 'Pending' : status === 'Approved'  ? 'Approved' : 'Rejected'}
                        type={status === 'Pending' ? 'Alert' : status === 'Approved'  ? 'Success' : 'Warning'}
                    />
                   </div>
                ),
                },
            ];
        },[approvalList] );
 
const noRecordsFound = useCallback(() => {
        return (
            <div className={styles['empty-approval-state']}>
                    <Flex vertical gap={8} align='center'>
                            <UserProfileSettingsPrimaryRoleNew />
                        <Label type="body1">
                            <span className={styles['rm-card-title']}>No Requested Approvals</span>
                        </Label>
                        <Label type="body2">
                            <span className={styles['rm-card-description']}>
                                Requested approvals will show up here
                            </span>
                        </Label>
                    </Flex>
                </div>
        );
    }, []);
   
return(
    <>
    <Card className={styles['user-profile-settings-approval-card']}>
        <Flex vertical className={styles['rm-container']} gap={24}align='center'>
             
        </Flex>
         <Flex vertical className={styles['rm-container']} gap={24}>
            <Flex justify="space-between">
                <Flex vertical gap={8}>
                    <Label type="body1">
                        <span className={styles['rm-card-title']}>All Requests</span>
                    </Label>
                    <Label type="body2">
                        <span className={styles['rm-card-description']}>
                          View all approval requests and take action on pending approvals
                        </span>
                    </Label>
                </Flex>
            </Flex>
            <div className={styles['table-container']}>
                <div className={styles['table-inner']}>
                    {loading && (
                        <div className={styles['overlay']}>
                            <AnimatedLoaders id="lazy-loader" type="page" />
                        </div>
                    )}
                    <Table
                        columns={renderColumns as any}
                        data={approvalList ?? []}
                        ref={tableRef}
                        className={styles['table-class']}
                    />
                    {isOpen && (
                         <ForumApproval isOpen={isOpen} handleClose={setIsOpen} requestData={selectedRowData as IRequestApproval}></ForumApproval>
                    )}
                </div>
                {!loading &&  approvalList?.length === 0 && noRecordsFound()}
            </div>
            </Flex>
    </Card>
    </>
);
}
 
export default ApprovalSection;
 