import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI } from '../../services/api';

interface RawBusinessUnit {
  businessUnit: string;
}

interface RawLine {
  line: string;
}

interface Option {
  label: string;
  value: string;
}

export const BusinessUnitLocalFilter = createAsyncThunk<Option[], string>(
  'localFilter/BusinessUnitLocalFilter',
  async (searchTerm) => {
      const response = await getAPI('/api/common/business-unit', { search: searchTerm });
      const rawData: RawBusinessUnit[] = response.data.data;
      const formattedData: Option[] = rawData.map((item) => ({
        label: item.businessUnit,
        value: item.businessUnit,
      }));

      return formattedData;
  }
);

export const LineLocalFilter = createAsyncThunk<Option[], string>(
  'localFilter/LineLocalFilter',
  async (searchTerm) => {
    const response = await getAPI('/api/common/line', { search: searchTerm });
    const rawData: RawLine[] = response.data.data;

    const formattedData: Option[] = rawData.map(item => ({
      label: item.line,
      value: item.line,
    }));

    return formattedData;
  }
);