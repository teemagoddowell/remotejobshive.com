import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

const ClientOnlyTimestamp = ({ date }) => {
    const [timeAgo, setTimeAgo] = useState(null);

    useEffect(() => {
        const formattedTime = formatDistanceToNow(new Date(date), { addSuffix: true });
        setTimeAgo(formattedTime);
    }, [date]); 
    return <p>{timeAgo}</p>;
};

export default ClientOnlyTimestamp;