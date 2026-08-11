import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { ROLE_TYPE } from './constants';
import { useEffect, useState } from 'react';
import { SaveUserTimezoneOffset } from '../services/users';

export const useIsGuestUser = () => {
    const roleType = useSelector((state: RootState) => state.primaryRole.data?.roleType);
    return !roleType ? true : roleType === ROLE_TYPE.GUEST;
};

export const useDebounce = (value: string, delay = 500) => {
    const [debounceValue, setDebounceValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebounceValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debounceValue;
};

export const useUpdateUserTimeZoneOffset =()=>{
    const currentOffset = useSelector((state: RootState) => state.userTimezoneOffset.data);
    const offsetMinute = new Date().getTimezoneOffset()

    useEffect(()=>{       
        if(currentOffset.userTimeOffset !==null && currentOffset.userTimeOffset !== offsetMinute){            
            //update timezone offset
            SaveUserTimezoneOffset(offsetMinute);
        }
    },[currentOffset])

    
}
