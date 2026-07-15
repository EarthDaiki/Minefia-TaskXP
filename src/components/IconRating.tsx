import "./IconRating.css"

type IconRatingProps = {
    Icon: React.ComponentType,
    value: number,
    onChange?: (value: number) => void;
    max: number;
    readOnly?: boolean;
}

export function IconRating({ Icon, value, onChange, max, readOnly = false,}: IconRatingProps) {
    const isInteractive = !readOnly && onChange !== undefined;
    return (
        <div className="rating-container">
            {Array.from({length: max}, (_, index) => {
                const ratingValue = index + 1;
                const isSelected = ratingValue <= value;
                return (
                    <div key={ratingValue}>
                        {readOnly ? (
                            <span className={isSelected ? "rating-icon selected" : "rating-icon"}>
                                <Icon />
                            </span>
                        ) : (
                            <button 
                                type="button" 
                                className={isSelected ? "rating-icon-button selected" : "rating-icon-button"} 
                                onClick={() => {
                                    if (!isInteractive) return;
                                    onChange(ratingValue);
                                }}
                            >
                                <Icon/>
                            </button>
                        )}
                    </div>
                )
            })}
        </div>
    )
}