export interface ApiUser {
  username: string;
  useremail: string;
  roleId?: number;
  roleName?: string;
}

export interface ApiUserGroup {
  id: string;
  usergroupname: string;
  users: ApiUser[];
}

export interface UserGroupState {
  groups: ApiUserGroup[];
  loading: boolean;
  error: string | null;
}
