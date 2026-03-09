import { Pen } from "lucide-react"
export default function TweetButton({onClick}: {onClick: () => void}) {
    return (
        <button onClick={onClick} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full transition-colors">
            <Pen />
        </button>
    )
}