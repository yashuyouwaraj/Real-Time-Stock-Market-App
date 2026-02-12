import Image from "next/image";
import Link from "next/link";
import NavItems from "./NavItems";
import UserDropDown from "./UserDropDown";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import { getWatchlistSymbolsByUserId } from "@/lib/actions/watchlist.actions";

const Header = async ({user}:{user:User}) => {

  const initialStocks = await searchStocks()
  const watchlistSymbols = await getWatchlistSymbolsByUserId(user.id)

  return (
    <header className="sticky top-0 header">
      <div className="container header-wrapper">
        <Link href="/">
          <Image
            src="/assets/icons/logo.svg"
            alt="Signalist logo"
            width={140}
            height={32}
            className="h-8 w-auto cursor-pointer"
          />
        </Link>
        <nav className="hidden sm:block">
          <NavItems initialStocks={initialStocks} watchlistSymbols={watchlistSymbols} />
        </nav>
        <UserDropDown user={user} initialStocks={initialStocks} watchlistSymbols={watchlistSymbols} />
      </div>
    </header>
  );
};

export default Header;
