import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import PermissionManagementTable from "./PermissionManagementTable";

jest.mock("konnect-react-components", () => ({
  AnimatedLoaders: () => <div data-testid="loader" />,
  Button: ({ text, ...props }: any) => <button {...props}>{text}</button>,
  CheckBox: ({ checked, ...props }: any) => <input type="checkbox" checked={checked} {...props} />,
  Counter: ({ value }: any) => <span data-testid="counter">{value}</span>,
  Icon: ({ name }: any) => <span data-testid={`icon-${name}`} />,
  IconButton: ({ icon, ...props }: any) => <button data-testid={`icon-btn-${icon}`} {...props}>{icon}</button>,
  SearchInput: ({ onChange, ...props }: any) => <input data-testid="search-input" onChange={e => onChange(e.target.value)} {...props} />,
  Table: ({ data, columns }: any) => <div data-testid="table">{JSON.stringify(data)}{JSON.stringify(columns)}</div>,
  TagSelector: () => <div data-testid="tag-selector" />,
  Dialog: ({ isOpen, title, content, primaryButtonText, secondaryButtonText}: any) =>
    isOpen ? (
      <div data-testid="dialog">
        <div>{title}</div>
        <div>{content}</div>
        <button>{primaryButtonText}</button>
        <button>{secondaryButtonText}</button>
      </div>
    ) : null,
  Toast: ({ type, message, toggle }: any) => toggle ? <div data-testid={`toast-${type}`}>{message}</div> : null,
}));

jest.mock("antd", () => ({
  Flex: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Tooltip: ({ children }: any) => <span>{children}</span>,
}));

jest.mock("../../atoms", () => ({
  Label: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

jest.mock("../application-filter-popup/ApplicationFilterPopup", () => ({
  __esModule: true,
  default: ({ isOpen }: any) => isOpen ? <div data-testid="filter-popup" /> : null,
}));

jest.mock("../permission-management-applications-permissions/PermissionManagementApplicationsPermissionsFlyout", () => ({
  __esModule: true,
  default: ({ toggleFlyout }: any) => toggleFlyout ? <div data-testid="app-permissions-flyout" /> : null,
}));

jest.mock("../../../assets/images/images", () => ({
  NoMatchesFound: () => <div data-testid="no-matches-found" />,
  PermissionDataEmptyState: () => <div data-testid="empty-state" />,
}));

jest.mock("../../../assets/icons/icons", () => ({
  ExpandArrow: () => <span data-testid="expand-arrow" />,
}));

jest.mock("../../atoms/custom-switch/CustomSwitch", () => ({
  __esModule: true,
  default: ({ isOn, toggleSwitch }: any) => <button data-testid="custom-switch" onClick={toggleSwitch}>{isOn ? "ON" : "OFF"}</button>,
}));

jest.mock("../../../services/permission", () => ({
  getAppRolePermissionDetails: jest.fn(() => Promise.resolve({
    toolRolePermissionData: [
      {
        toolId: 1,
        toolName: "Tool1",
        toolType: "TypeA",
        roleId: 101,
        roles: [
          { roleId: 101, role: "Admin", roleRegion: "US", permissionCount: 2, isActivePermission: true },
        ],
        expandedRowData: [
          {
            toolPermissionId: 201,
            toolPermissionName: "Perm1",
            toolPermissionDescription: "Desc1",
            toolModuleName: "Module1",
            roles: [
              { roleId: 101, isActivePermission: true, role: "Admin", roleRegion: "US", permissionCount: 2 },
            ],
          },
        ],
      },
    ],
    pagination: { totalRows: 1 },
    isRoleNotMapped: false,
    isToolNotMapped: false,
    roleToolNotMapped: false,
    totalRoles: 1,
  })),
  submitApplicationRoleMapping: jest.fn(() => Promise.resolve({ statusCode: 200 })),
}));

jest.mock("../../../store", () => ({
  fetchLocationsForChip: jest.fn(),
}));

jest.mock("react-redux", () => ({
  useDispatch: () => jest.fn(),
  useSelector: jest.fn(fn => fn({
    roleFunctions: {
      toolsData: [
        { toolId: 1, toolName: "Tool1", toolType: "TypeA" },
      ],
      data: [
        { functionId: 1, functionName: "Func1" },
      ],
      rolesData: [
        { roleId: 101, role: "Admin", roleRegion: "US" },
      ],
      geographyChipDetails: [
        { geographyId: 1, geography: "Geo1" },
      ],
    },
  })),
}));

describe("PermissionManagementTable", () => {
  it("renders table and header", async () => {
    render(<PermissionManagementTable />);
    expect(screen.getByText(/Tools Access Settings/i)).toBeInTheDocument();
    expect(await screen.findByTestId("table")).toBeInTheDocument();
  });

  it("shows loader when loading", () => {
    render(<PermissionManagementTable />);
    expect(screen.queryByTestId("loader")).not.toBeNull();
  });

  it("shows toast after saving edits", async () => {
    render(<PermissionManagementTable />);
    // Wait for Edit button to appear
    const editButton = await screen.findByText("Edit");
    fireEvent.click(editButton);
    // Wait for Save button to appear
    const saveButton = await screen.findByText("Save");
    fireEvent.click(saveButton);
    expect(await screen.findByTestId("toast-Success")).toBeInTheDocument();
  });
});
