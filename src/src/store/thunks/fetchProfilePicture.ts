import { createAsyncThunk } from '@reduxjs/toolkit';

const fetchProfilePicture = createAsyncThunk(
    'profile/fetchProfilePicture',
    async ({ graphAccessToken, userEmail }: { graphAccessToken: string; userEmail: string }) => { 
        const headers = new Headers();
        headers.append('Authorization', `Bearer ${graphAccessToken}`);

        const response = await fetch(
            `https://graph.microsoft.com/v1.0/users/${userEmail}/photo/$value`,
            {
                method: 'GET',
                headers,
            }
        );

        if (!response.ok) {
            throw new Error(`Error fetching profile picture: ${response.status}`);
        }

        const imageBlob = await response.blob();
        const imageUrl = URL.createObjectURL(imageBlob);
        return imageUrl; 
    }
);

export { fetchProfilePicture };
