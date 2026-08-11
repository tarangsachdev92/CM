import React from 'react';
import { Skeleton } from 'antd';

type TextWithSkeletonProps = {
    loading: boolean;
    skeletonHeight: number | string;
    skeletonWidth: number | string;
    className?: string;
    children: React.ReactNode;
};
const TextWithSkeleton: React.FC<TextWithSkeletonProps> = ({ loading, skeletonHeight, skeletonWidth, className, children }) => {
    if (loading) {
        return (
            <Skeleton.Node
                active
                style={{ width: skeletonWidth, height: skeletonHeight }}
            />
        );
    }
    return <span className={className}>{children}</span>;
};

export default TextWithSkeleton;
