type IFrameProps = {
    url: string
}

function AppIFrame({ url }: IFrameProps) {
    return (
        <div>
            <iframe
                src={url}
                title="iFrame"
                width="100%"
                height="100%"
                style={{ border: 'none' }}
                referrerPolicy="no-referrer"
            />
        </div>
    );
}

export default AppIFrame;