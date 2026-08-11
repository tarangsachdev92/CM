import React, { useEffect, useState } from 'react';
import styles from './ProfileCard.module.scss';
import { Dialog, DropDown, Icon, Toast } from 'konnect-react-components';
import { Flex, Tooltip } from 'antd';
import { getLanguageList, SaveUserLanguage } from '../../../services/users';
import { Language } from '../../../types/common';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, fetchUserLanguage, RootState } from '../../../store';

type ProfileCardProps = {
    title: string;
    primaryRole: string;
    secondaryRoles: string[];
    level: string;
    function: string;
    location: string;
    language: string;
};

const ProfileCard: React.FC<ProfileCardProps> = ({
    title,
    primaryRole,
    secondaryRoles,
    level,
    function: func,
    location
}) => {
    const [languagePopupOpen, setLanguagePopupOpen] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState<Language>();
    const [changingLanguage, setChangingLanguage] = useState(false);
    const [languageList, setLanguageList] = useState<Language[]>([]);
    const [toastConfig, setToastConfig] = useState<{
        visible: boolean;
        message: string;
        type: 'Success' | 'Error';
    }>({ visible: false, message: '', type: 'Success' });

    const dispatch = useDispatch<AppDispatch>();

    const handleLanguageChange = () => {
        setChangingLanguage(true);
        if (selectedLanguage) {
            SaveUserLanguage(selectedLanguage).
                then(_ => {
                    setChangingLanguage(false);
                    dispatch(fetchUserLanguage());
                    setLanguagePopupOpen(false);
                    setToastConfig({
                        visible: true,
                        message: `Language updated to ${selectedLanguage.languageName}`,
                        type: 'Success',
                    });

                })
                .catch(_ => {
                    setLanguagePopupOpen(false);
                    setLanguagePopupOpen(false);
                    setToastConfig({
                        visible: true,
                        message: `Error updating language.`,
                        type: 'Success',
                    });
                });
        }
    }

    const userLanguage = useSelector((state: RootState) => state.userLanguage.data);

    const getLanguages = () => {
        let languages: Language[] = [];
        getLanguageList()
            .then(resp => {
                languages = resp.data.data;
                setLanguageList(languages);
            })
            .catch(() => {
                setLanguageList(languages);
            });
    };

    useEffect(() => {
        getLanguages();
    }, [])


    return (
        <Flex vertical gap={24}>
            <Flex vertical className={styles['profile-card']}>
                <span className={styles['profile-title']}>{title}</span>
                <Flex vertical gap={12} className={styles['profile-content']}>
                    <Flex gap={4} className={styles['profile-item']} align='center'>
                        <Icon size='m' name="user-01" />
                        <span className={styles['profile-item-title']}>Primary Role :</span>
                        <span className={styles['profile-item-desc']}>
                            {primaryRole}
                        </span>
                    </Flex>
                    <Flex gap={4} className={styles['profile-item']} align='center'>
                        <Icon size='m' name="barr-chart-01" />
                        <span className={styles['profile-item-title']}>Level :</span>
                        <span className={styles['profile-item-desc']}>
                            {level}
                        </span>
                    </Flex>
                    <Flex gap={4} className={styles['profile-item']} align='center'>
                        <Icon size='m' name="sliders-01" />
                        <span className={styles['profile-item-title']}>Function :</span>
                        <span className={styles['profile-item-desc']}>
                            {func}
                        </span>
                    </Flex>
                    <Flex gap={4} className={styles['profile-item']} align='center'>
                        <Icon size='m' name="marker-pin-01" />
                        <span className={styles['profile-item-title']}>Location :</span>
                        <span className={styles['profile-item-desc']}>
                            {location}
                        </span>
                    </Flex>
                    <Flex gap={4} className={styles['profile-item']} align='center'>
                        <Icon size='m' name="users-01" />
                        <span className={styles['profile-item-title']}>Secondary Role :</span>
                        <span className={styles['profile-item-desc']}>
                            <Tooltip
                                placement="bottom"
                                title={secondaryRoles.length > 0 ? secondaryRoles.join(', ') : 'N/A'}
                            >
                                <span className={styles['profile-detail-subtitle']}>
                                    {secondaryRoles.length > 0 ? (
                                        <div className={styles['secondary-role']}>
                                            <span className={styles['truncate-text']}>
                                                {secondaryRoles[0]}
                                            </span>
                                            {secondaryRoles.length > 1 && (
                                                <span className={styles['secondary-role-count']}>
                                                    +{secondaryRoles.length - 1}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        'N/A'
                                    )}
                                </span>
                            </Tooltip>
                        </span>
                    </Flex>
                    <Flex gap={4} className={styles['profile-item']} align='center'>
                        <Icon size='m' name="translate-01" />
                        <span className={styles['profile-item-title']}>Language :</span>
                        <span className={styles['profile-item-desc']}>
                            <DropDown
                                id="user-language"
                                className={styles['language-ddl']}
                                dropdown={{
                                    label: '',
                                    options:
                                        languageList &&
                                        languageList.map(l => ({
                                            label: l.languageName ?? '',
                                            value: l.languageCode,
                                        })),
                                    reset: false,
                                    placeholder: 'Select',
                                    required: false,
                                    onChange: option => {
                                        setSelectedLanguage({
                                            languageCode: option.value,
                                            languageName: option.label,
                                        });
                                        setLanguagePopupOpen(true);
                                    },
                                    selectedOptions:
                                        userLanguage !== null
                                            ? [
                                                {
                                                    label: userLanguage.languageName,
                                                    value: userLanguage.languageCode,
                                                },
                                            ]
                                            : [],
                                    isDisabled: languageList.length <= 0,
                                }}
                                searchInput={
                                    languageList && languageList.length > 10
                                        ? {
                                            searchPlaceholder: 'Search',
                                            searchSize: 'S',
                                            searchWholeString: true,
                                        }
                                        : undefined
                                }
                            />
                        </span>
                    </Flex>
                </Flex>
            </Flex>
            {languagePopupOpen && (
                <Dialog
                    content={
                        <>
                            <span>
                                You have selected the language “{selectedLanguage?.languageName}
                                ” for your Command Center experience. This change will apply only to
                                you and will not affect other users.
                            </span>
                            <br />
                            <br />
                            <span>Would you like to proceed with this change?</span>
                        </>
                    }
                    isOpen={true}
                    onClose={() => {
                        setLanguagePopupOpen(false);
                    }}
                    onPrimaryButtonClick={() => {
                        handleLanguageChange();
                    }}
                    primaryButtonText="Change Language"
                    title="Change Language"
                    loading={changingLanguage}
                />
            )}
            {toastConfig.visible && (
                <Toast
                    distance="x5l"
                    message={toastConfig.message}
                    mode="Top Right"
                    onCloseToast={() => setToastConfig({ ...toastConfig, visible: false })}
                    toggle
                    type={toastConfig.type}
                    timer={5000}
                />
            )}
        </Flex >
    );
};

export default ProfileCard;
