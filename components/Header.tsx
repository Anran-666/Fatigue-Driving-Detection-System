import React, { useState, useEffect, useRef } from 'react';
import { UserIcon, CarIcon } from './icons';
import { UserId } from '../types';

interface HeaderProps {
    currentUser: UserId;
    users: UserId[];
    onUserChange: (userId: UserId) => void;
}

const userDisplayNames: { [key in UserId]: string } = {
    'driver1': '驾驶员 01',
    'driver2': '驾驶员 02',
};

const Header: React.FC<HeaderProps> = ({ currentUser, users, onUserChange }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleUserSelect = (userId: UserId) => {
        onUserChange(userId);
        setIsDropdownOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <header className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
                <CarIcon className="w-10 h-10 text-blue-400" />
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">疲劳驾驶检测系统</h1>
                    <p className="text-sm text-gray-400">多模态融合与预测分析</p>
                </div>
            </div>
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-3 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-full transition-colors duration-200"
                >
                    <UserIcon className="w-6 h-6 text-gray-400" />
                    <span className="text-white font-medium hidden sm:block">{userDisplayNames[currentUser]}</span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-xl z-10 overflow-hidden">
                        <ul>
                            {users.map(userId => (
                                <li key={userId}>
                                    <a
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleUserSelect(userId);
                                        }}
                                        className={`block px-4 py-2 text-sm ${currentUser === userId ? 'bg-blue-600 text-white' : 'text-gray-200 hover:bg-gray-600'}`}
                                    >
                                        {userDisplayNames[userId]}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </header>
    );
};

export default React.memo(Header);