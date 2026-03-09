"use client";
import { Search } from "lucide-react"
import { useState } from "react";
export default function SearchBar() {
    const [searchTerm, setSearchTerm] = useState("");
    
    return (
        <div className="flex self-center items-center bg-gray-800 rounded-full  w-80 mt-6 mb-4 gap-2">
            <button className="bg-gray-700 self-stretch rounded-l-full px-3 py-2 flex items-center cursor-pointer hover:bg-gray-600 transition-colors">
                <Search className=""/>
            </button>
            <input 
                type="text" 
                placeholder="Search..." 
                className="flex-1 bg-transparent outline-none placeholder:text-gray-400" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
    )
}