import { SVGProps } from 'react';

export const QuickLinksIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} fill="none" {...props}>
        <g clipPath="url(#a)">
            <path
                fill="#4A4A4A"
                fillRule="evenodd"
                d="M8.518 1.834a4 4 0 0 1 5.656 5.656l-.008.008-2 2a4 4 0 0 1-6.032-.432.667.667 0 0 1 1.067-.799 2.667 2.667 0 0 0 4.022.288l1.995-1.995a2.667 2.667 0 0 0-3.77-3.77L8.303 3.926a.667.667 0 1 1-.94-.945l1.147-1.14.007-.007ZM5.267 5.582a4 4 0 0 1 4.601 1.352.667.667 0 1 1-1.068.799 2.667 2.667 0 0 0-4.021-.288L2.783 9.44a2.667 2.667 0 0 0 3.77 3.77l1.136-1.135a.667.667 0 0 1 .943.943l-1.14 1.14-.008.008A4 4 0 0 1 1.828 8.51l.008-.008 2-2a4 4 0 0 1 1.43-.92Z"
                clipRule="evenodd"
            />
        </g>
        <defs>
            <clipPath id="a">
                <path fill="#fff" d="M0 0h16v16H0z" />
            </clipPath>
        </defs>
    </svg>
);
