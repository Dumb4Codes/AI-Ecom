import { Link } from 'react-router-dom'
import logo from '@/assets/logo.webp'
import { cn } from '@/lib/utils'

const Logo = ({className, to = "/", showText = true}: {className?: string, to?:string, showText?: boolean}) => {
    return (
        <Link to={to} className={cn("flex items-center gap-2 font-medium", className)}>
           <div className="size-7"> <img src={logo} alt="instant" width={28} height={28} className="size-full object-contain" /></div>
            {showText && <span className='font-serif text-[23px] font-semibold tracking-tight dark:text-white'>instantly</span>}
        </Link>
    )
}

export default Logo
