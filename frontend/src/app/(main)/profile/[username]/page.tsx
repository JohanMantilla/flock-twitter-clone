export default function ProfilePage({ params }: { params: { username: string } }) {
    return (
        <div className="p-6">
            <h1 className="text-xl font-medium text-gray-900">@{params.username}</h1>
            <p className="text-gray-500 mt-2">Profile coming soon</p>
        </div>
    );
}