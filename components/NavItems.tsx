'use client'

import {NAV_ITEMS} from "@/lib/constants";
import Link from "next/link";
import {usePathname} from "next/navigation";
import SearchCommand from "./SearchCommand";

const NavItems = ({initialStocks, watchlistSymbols}: { initialStocks: StockWithWatchlistStatus[]; watchlistSymbols: string[] }) => {
    const pathname = usePathname()

    const isActive = (path: string) => {
        if (path === '/') return pathname === '/';

        return pathname.startsWith(path);
    }

    return (
        <ul className="nav-list">
            {NAV_ITEMS.map(({ href, label }) => {
                if(href === '/search') return (
                    <li key="search-trigger">
                        <SearchCommand
                            renderAs="text"
                            label="Search"
                            initialStocks={initialStocks}
                            watchlistSymbols={watchlistSymbols}
                        />
                    </li>
                )

                return <li key={href}>
                    <Link href={href} className={`hover:text-yellow-400 transition-colors duration-200 ${
                        isActive(href) ? 'text-gray-100' : 'text-gray-400'
                    }`}>
                        {label}
                    </Link>
                </li>
            })}
        </ul>
    )
}
export default NavItems
