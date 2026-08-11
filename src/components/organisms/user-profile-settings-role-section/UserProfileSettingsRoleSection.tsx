// UserProfileSettingsRoleSection.tsx
 
import { useEffect, useRef, useState, useMemo } from 'react';
import { Card, Flex, Skeleton } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { Dialog, Toast } from 'konnect-react-components';
import { Label, TextButton } from '../../atoms';
import { UserProfileSettingsRolesCard, UserProfileSettingsForumRolesCard } from '../../molecules';
import { UserProfileSettingsPrimaryRole } from '../../../assets/images/images';
import RoleSelectionPopup from '../role-selection-popup/RoleSelectionPopup';
import { ROLE_TYPE } from '../../../utils/constants';
import {
  RootState,
  AppDispatch,
  fetchUserSecondaryRole,
  fetchPrimaryRole,
  fetchUserDelegatedRole,
  fetchUserDelegationRole,
} from '../../../store';
import { deleteUserSecondaryRole } from '../../../services/users';
import styles from './UserProfileSettingsRoleSection.module.scss';
import { IDelegateRoleProfile, IUserRole } from '../../../types/response';
import SecondaryPermissionsFlyout from '../secondary-permission-flyout/SecondaryPermissionFlyout';
import DelegationPermissionsFlyout from '../delegation-permission-flyout/DelegationPermissionFlyout';
import { fetchUserToolPermissions } from '../../../store/thunks/fetchUserToolPermissions';
import { logError } from '../../../utils/helpers';

function UserProfileSettingsRoleSection() {
  const dispatch = useDispatch<AppDispatch>();
  const [showPrimaryRoleModal, setShowPrimaryRoleModal] = useState<boolean>(false);
  const [isSecondaryRoleDeletionDialogOpen, setIsSecondaryRoleDeletionDialogOpen] =
    useState<boolean>(false);
  const [toggleToast, setToggleToast] = useState<boolean>(false);
  const [delegationToastOpen, setDelegationToastOpen] = useState<boolean>(false);
  const [delegationToastMessage, setDelegationToastMessage] = useState<string>('');
  const roleIdRef = useRef({ roleId: 0 });
  const [isAddingSecondaryRole, setIsAddingSecondaryRole] = useState<boolean>(false);

  const userPrimaryRole = useSelector((state: RootState) => state.userRole.primary);
  const delegationRoles = useSelector((state: RootState) => state.userRole.delegationRoles);
  const userSecondaryRoles = useSelector((state: RootState) => state.userRole.secondary);
  const userRoleLoadingState = useSelector((state: RootState) => state.userRole.isLoading);
  const isPrimaryRoleAdded = userPrimaryRole?.isAnyADGroupRequested;
  const isSecondaryRoleAdded =
    userSecondaryRoles.roles.length > 0 &&
    userSecondaryRoles.roles.some(role => role.isAnyADGroupRequested);

  const delegatedBucket = useSelector(
    (state: RootState) =>
      state.userRole.delegated ?? { delegateRoleProfile: [], delegateRoleStatusSummary: [] }
  );

  const delegatedProfiles = delegatedBucket?.delegateRoleProfile ?? [];
  const delegateStatusSummaryList = delegatedBucket?.delegateRoleStatusSummary ?? [];

  
const delegationRolesById = useMemo(() => {
  const m = new Map<number, IUserRole>();
  for (const r of delegationRoles ?? []) {
    if (Number.isFinite(Number(r?.roleId))) m.set(Number(r.roleId), r);
  }
  return m;
}, [delegationRoles]);


  const [flyoutDelegationVisible, setFlyoutDelegationVisible] = useState(false);
  const [selectedDelegation, setSelectedDelegation] = useState<{
    roleId: number;
    roleType: string;
    region: string;
    roleName: string;
    toolId: number | null;
  }>({ roleId: 0, roleType: ROLE_TYPE.DELEGATED, region: '', roleName: '', toolId: null });

  const handleDelegationRoleClick = async (profile: IDelegateRoleProfile) => {
    setSelectedDelegation({
      roleId: profile.roleId,
      roleType: ROLE_TYPE.DELEGATED,
      region: profile.roleRegion ?? '',
      roleName: profile.roleName ?? '',
      toolId: null,
    });
    setFlyoutDelegationVisible(true);
    try {
      const res = await dispatch(
        fetchUserToolPermissions({
          roleId: profile.roleId,
          roleType: ROLE_TYPE.DELEGATED,
          pageNumber: 1,
          pageSize: 25,
        })
      ).unwrap();
      const tools = Array.isArray(res?.tools) ? res.tools : [];
      const candidate = tools.find(t => Number.isFinite(Number(t?.toolId)) && Number(t.toolId) > 0);
      const firstToolId = candidate ? Number(candidate.toolId) : null;
      if (!firstToolId) {
        setDelegationToastMessage('No tools available for this delegated role.');
        setDelegationToastOpen(true);
        return;
      }
      setSelectedDelegation(prev => ({ ...prev, toolId: firstToolId }));
    } catch {
      setDelegationToastMessage('Failed to load tools for this delegated role.');
      setDelegationToastOpen(true);
    }
  };

  const onClickHandlerForRoleDelete = (roleData: { roleId: number }) => {
    roleIdRef.current.roleId = roleData.roleId;
    setIsSecondaryRoleDeletionDialogOpen(!isSecondaryRoleDeletionDialogOpen);
  };

  const onSecondaryRoleDelete = async () => {
    try {
      const result = await deleteUserSecondaryRole({ roleId: roleIdRef.current.roleId });
      if (result.data) {
        setIsSecondaryRoleDeletionDialogOpen(!isSecondaryRoleDeletionDialogOpen);
        setToggleToast(true);
        dispatch(fetchUserSecondaryRole({ roleType: ROLE_TYPE.SECONDARY }));
      }
    } catch (err) {
      logError(err)
    }
  };

  const onSecondaryRoleDeleteDialogClose = () => {
    setIsSecondaryRoleDeletionDialogOpen(!isSecondaryRoleDeletionDialogOpen);
  };

  const showSecondaryRoleModel = () => {
    setIsAddingSecondaryRole(true);
    setShowPrimaryRoleModal(true);
  };

  const onRolePopupCancelClick = () => {
    setIsAddingSecondaryRole(false);
    setShowPrimaryRoleModal(false);
  };

  useEffect(() => {
    dispatch(fetchPrimaryRole());
    dispatch(fetchUserDelegatedRole({ roleType: ROLE_TYPE.DELEGATED }));
    dispatch(fetchUserDelegationRole({ roleType: ROLE_TYPE.DELEGATED }));
  }, [dispatch]);

  const [flyoutVisible, setFlyoutVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState({ roleId: 0, roleType: '', region: '' });

  const handleSecondaryRoleClick = (role: IUserRole) => {
    setSelectedRole({ roleId: role.roleId, roleType: 'Secondary', region: role.region });
    setFlyoutVisible(true);
  };

  return (
    <>
      <Card className={styles['user-profile-settings-card']}>
        <div className={styles['role-card-title']}>Primary Role</div>
        {!userPrimaryRole?.role ? (
          <div className={styles['role-card-children']}>
            <UserProfileSettingsPrimaryRole />
            <Label type="h2">
              <span className={styles['role-card-children-title']}>Primary Role Not Added</span>{' '}
            </Label>
            <Label type="body3">
              <span className={styles['role-card-children-label']}>
                Setup your{' '}
                <span className={styles['role-card-children-label-highlighted']}>
                  <button type="button" onClick={() => setShowPrimaryRoleModal(true)}>
                    Primary Role
                  </button>
                </span>{' '}
                to track KPIs and setup your filters{' '}
              </span>
            </Label>
          </div>
        ) : (
          <UserProfileSettingsRolesCard
            roleType={ROLE_TYPE.PRIMARY}
            roleData={userPrimaryRole}
            isSecondaryRoleAdded={isSecondaryRoleAdded}
            onEditClick={() => setShowPrimaryRoleModal(true)}
          />
        )}
        <RoleSelectionPopup
          isOpen={showPrimaryRoleModal}
          isPrimaryRoleAdded={isPrimaryRoleAdded}
          onCancelClick={() => onRolePopupCancelClick()}
          isAddingSecondaryRole={isAddingSecondaryRole}
        />
      </Card>

      <Card className={styles['user-profile-settings-card']}>
        <Flex justify="space-between" className={styles['user-profile-settings-card-secondary-heading']}>
          <div className={styles['role-card-title']}>Secondary Role</div>
          <TextButton onClick={() => showSecondaryRoleModel()} disabled={!isPrimaryRoleAdded}>
            <div
              className={
                isPrimaryRoleAdded
                  ? styles['secondary-role-card-title']
                  : styles['secondary-role-card-title-disabled']
              }
            >
              + Secondary Role
            </div>
          </TextButton>
        </Flex>
        {!userSecondaryRoles.roles.length ? (
          <SecondaryRoleCardEmptyState
            userRoleLoadingState={userRoleLoadingState}
            isPrimaryRoleAdded={isPrimaryRoleAdded}
          />
        ) : (
          <div>
            {userSecondaryRoles.roles.map(role => (
              <UserProfileSettingsRolesCard
                key={role?.roleId}
                roleType={ROLE_TYPE.SECONDARY}
                roleData={role}
                onClickHandlerForRoleDelete={onClickHandlerForRoleDelete}
                onCardClick={() => handleSecondaryRoleClick(role)}
              />
            ))}
          </div>
        )}
        <SecondaryPermissionsFlyout
          roleId={selectedRole.roleId}
          roleType={selectedRole.roleType}
          roleRegion={selectedRole.region}
          toggleFlyout={flyoutVisible}
          onCancelIconClickOfFlyout={() => setFlyoutVisible(false)}
        />
        {userSecondaryRoles.otherRoles.length > 0 && (
          <div className={styles['user-profile-settings-card-secondary-roles-container']}>
            {userSecondaryRoles.otherRoles.map(role => (
              <UserProfileSettingsForumRolesCard key={role.collabType} roleData={role} />
            ))}
          </div>
        )}
      </Card>

      <Card className={styles['user-profile-settings-card']}>
        <div className={styles['role-card-title']}>Delegated Role</div>
        {userRoleLoadingState ? (
          <Skeleton active paragraph={{ rows: 4, width: '100%' }} />
        ) : delegatedProfiles.length === 0 ? (
          <div className={styles['role-card-label']}>
            All roles delegated to you will be visible here.
          </div>
        ) : (
          <div>
            {delegatedProfiles.map(profile => {
              // ✅ Pick the correct IUserRole for this profile.roleId (ensures tooltip uses correct adgroupsList)
              return (
                <UserProfileSettingsRolesCard
                  key={profile.roleId}
                  roleType={ROLE_TYPE.DELEGATED}
                  delegateData={profile}
                  delegateStatusSummaryList={delegateStatusSummaryList}
                  roleData={delegationRolesById.get(profile.roleId)}
                  username={profile.delegatedByUser ?? ''}
                  assignedStartDate={profile.startDate ?? null}
                  assignedEndDate={profile.endDate ?? null}
                  onCardClick={() => handleDelegationRoleClick(profile)}
                />
              );
            })}
          </div>
        )}
      </Card>

      {flyoutDelegationVisible && (
        <DelegationPermissionsFlyout
          roleId={selectedDelegation.roleId}
          roleType={selectedDelegation.roleType}
          roleRegion={selectedDelegation.region}
          roleName={selectedDelegation.roleName}
          toolId={selectedDelegation.toolId}
          toggleFlyout={flyoutDelegationVisible}
          onCancelIconClickOfFlyout={() => setFlyoutDelegationVisible(false)}
        />
      )}

      <Dialog
        id=""
        isOpen={isSecondaryRoleDeletionDialogOpen}
        title="Confirm Deletetion"
        content="Are you sure you want to delete this role? Deleting this role will result in the loss of all privileges for the existing tools."
        primaryButtonText="Delete Role"
        secondaryButtonText="Don’t Delete"
        onPrimaryButtonClick={onSecondaryRoleDelete}
        onSecondaryButtonClick={onSecondaryRoleDeleteDialogClose}
        onClose={onSecondaryRoleDeleteDialogClose}
      />

      <Toast
        toggle={toggleToast}
        type="Default"
        message="Secondary role deleted"
        mode="Top Right"
        distance="x5l"
        onCloseToast={() => setToggleToast(false)}
        timer={5000}
      />

      <Toast
        toggle={delegationToastOpen}
        type="Default"
        message={delegationToastMessage}
        mode="Top Right"
        distance="x5l"
        onCloseToast={() => setDelegationToastOpen(false)}
        timer={4000}
      />
    </>
  );
}

const SecondaryRoleCardEmptyState = ({
  userRoleLoadingState,
  isPrimaryRoleAdded,
}: {
  userRoleLoadingState: boolean;
  isPrimaryRoleAdded: boolean;
}) => {
  if (userRoleLoadingState) {
    return <Skeleton active paragraph={{ rows: 4, width: '100%' }} />;
  }
  return (
    <div
      className={
        isPrimaryRoleAdded
          ? styles['role-card-label-primary-role-added']
          : styles['role-card-label']
      }
    >
      {isPrimaryRoleAdded
        ? 'No secondary roles added. Click "Add New Role" to begin the process.'
        : 'Please add a primary role to start adding secondary roles.'}
    </div>
  );
};

export default UserProfileSettingsRoleSection;