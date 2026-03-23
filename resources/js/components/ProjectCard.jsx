import { Link } from "react-router-dom";

export default function ProjectCard({
    title = "PROJECT TITLE",
    category = "Brief Details",
    slug = "",
    image = "",
    aspectRatio = "aspect-[4/3]",
    className = "",
}) {
    return (
        <div className={`w-full flex flex-col gap-3 ${className}`}>
            <Link
                to={`/projects/${slug}`}
                className="group relative w-full overflow-hidden block"
            >
                <div className={`w-full bg-[#d9d9d9] relative ${aspectRatio}`}>
                    {image ? (
                        <img
                            src={`/storage/${image}`}
                            alt={title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <svg
                                className="h-10 w-10 text-black/20"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="1"
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                        </div>
                    )}

                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-500" />
                </div>
            </Link>

            {/* Text Details */}
            <div className="border-b border-black pb-2 flex flex-col items-start w-full">
                <h3 className="text-sm font-bold uppercase tracking-tight text-black">
                    {title}
                </h3>
                <p className="text-[10px] uppercase mt-1 text-gray-600 font-normal">
                    {category}
                </p>
            </div>
        </div>
    );
}
