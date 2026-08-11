import { SVGProps } from 'react';

export const ChartsIcon = (props:  SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={16}
    height={16}
    fill="none"
    {...props}
  >
    <path
      fill="#4A4A4A"
      fillRule="evenodd"
      d="M12 2c.369 0 .667.298.667.667v10.666a.667.667 0 1 1-1.333 0V2.667c0-.369.299-.667.667-.667ZM8 6c.369 0 .667.298.667.667v6.666a.667.667 0 1 1-1.333 0V6.667c0-.369.298-.667.667-.667Zm-4 4c.369 0 .667.299.667.667v2.666a.667.667 0 1 1-1.333 0v-2.666c0-.368.298-.667.667-.667Z"
      clipRule="evenodd"
    />
  </svg>
)
