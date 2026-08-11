import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import PerformanceManagement from "./PerformanceManagement";

jest.mock("konnect-react-components", () => ({
  AppReportCard: ({ title, description, additionalDescription }: any) => (
    <div data-testid="app-report-card">
      <div>{title}</div>
      <div>{description}</div>
      {additionalDescription}
    </div>
  ),
  SearchInput: ({ onChange, ...props }: any) => (
    <input data-testid="search-input" onChange={onChange} {...props} />
  ),
}));

jest.mock("antd", () => ({
  Flex: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

jest.mock("../../atoms", () => ({
  Label: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

jest.mock("react-router-dom", () => ({
  Link: ({ to, children }: any) => <a href={to}>{children}</a>,
}));

describe("PerformanceManagement", () => {
  it("renders header and search input", () => {
    render(<PerformanceManagement />);
    // Find all elements with the header text
    const headers = screen.getAllByText(/Performance Management/i);
    // Find the one with the correct class
    const header = headers.find(h => h.classList.contains("admin-console-header-title"));
    expect(header).toBeInTheDocument();
    expect(screen.getByTestId("search-input")).toBeInTheDocument();
  });

  it("renders Standard Reports section title", () => {
    render(<PerformanceManagement />);
    expect(screen.getByText(/Standard Reports/i)).toBeInTheDocument();
  });

  it("renders all AppReportCards with correct titles", () => {
    render(<PerformanceManagement />);
    expect(screen.getAllByTestId("app-report-card")).toHaveLength(4);
    expect(screen.getByText("Digital Permission Management")).toBeInTheDocument();
    expect(screen.getByText("Integrated Performance Management")).toBeInTheDocument();
    expect(screen.getByText("QHS Performance Review")).toBeInTheDocument();
    expect(screen.getByText("CRE Performance Review")).toBeInTheDocument();
  });

  it("updates search value on input change", () => {
    render(<PerformanceManagement />);
    const input = screen.getByTestId("search-input");
    fireEvent.change(input, { target: { value: "test search" } });
    expect((input as HTMLInputElement).value).toBe("test search");
  });

  it("renders documentation link for each card", () => {
    render(<PerformanceManagement />);
    // Only count links with the correct href
    const links = screen.getAllByRole("link").filter(link => link.getAttribute("href") === "https://example.com");
    expect(links).toHaveLength(4);
    links.forEach(link => {
      expect(link).toHaveTextContent(/Documentation & Access/i);
    });
  });
});
