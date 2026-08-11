import { createAsyncThunk } from '@reduxjs/toolkit';
import {  getAPI, postAPI } from '../../services/api';


/* =========================
   Forum Approval List
   ========================= */

const fetchForumApprovalDetails = createAsyncThunk(
  'forumApproval/fetchForumApprovalDetails',
  async () => {
    const response = await getAPI(
      'api/users/get-approvals-tab-details',
    );
    return response.data.data;
  },
);

/* =========================
   Forum Request approve/reject
   ========================= */
   
const saveRequestApprovalStatus = createAsyncThunk(
  'api/users/save-approvals-tab-status-by-requestid',
  async ({
    requestId,
    approvalStatus,
    comment,
  }: {
    requestId: number;
    approvalStatus: number;
    comment: string;
  }) => {
    const response = await postAPI(
      `api/users/save-approvals-tab-status-by-requestid?requestId=${encodeURIComponent(
        requestId,
      )}&approvalStatus=${encodeURIComponent(
        approvalStatus,
      )}&comment=${encodeURIComponent(comment)}`,
      {},
    );
    return response?.data?.data;
  },
);


export {
  fetchForumApprovalDetails,
  saveRequestApprovalStatus,
};
 