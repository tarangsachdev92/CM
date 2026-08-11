import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ForumDetailsForm from './ForumDetailsForm';

const defaultProps = {
  forumName: 'Test Forum',
  setForumName: jest.fn(),
  forumNameError: '',
  selectedGeography: '',
  applicationLocations: [],
  handleGeographyChange: jest.fn(),
  functionDD: [
    { label: 'Function 1', value: 'f1' },
    { label: 'Function 2', value: 'f2' },
  ],
  selectedFunctions: [],
  setSelectedFunctions: jest.fn(),
  forumOwner1Options: [
    { label: 'Owner 1', value: 'o1' },
    { label: 'Owner 2', value: 'o2' },
  ],
  selectedForumOwner1: [],
  setSelectedForumOwner1: jest.fn(),
  forumOwner2Options: [
    { label: 'Owner 3', value: 'o3' },
    { label: 'Owner 4', value: 'o4' },
  ],
  selectedForumOwner2: [],
  setSelectedForumOwner2: jest.fn(),
  collaboratorOptions: [
    { label: 'Collab 1', value: 'c1' },
    { label: 'Collab 2', value: 'c2' },
  ],
  selectedCollaborators: [],
  setSelectedCollaborators: jest.fn(),
  styles: {},
};

describe('ForumDetailsForm', () => {
  it('renders forum name input and info', () => {
    render(<ForumDetailsForm {...defaultProps} />);
    expect(screen.getByPlaceholderText('Enter forum name')).toBeInTheDocument();
    expect(screen.getByText(/Characters/i)).toBeInTheDocument();
  });

  it('calls setForumName on valid input change', () => {
    render(<ForumDetailsForm {...defaultProps} />);
    const input = screen.getByPlaceholderText('Enter forum name');
    fireEvent.change(input, { target: { value: 'Valid Name' } });
    expect(defaultProps.setForumName).toHaveBeenCalledWith('Valid Name');
  });
});
