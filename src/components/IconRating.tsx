type IconRatingProps = {
    Icon: React.ComponentType,
    value: number,
    onChange: (value: number) => void;
    max: number;
}

export function IconRating({ Icon, value, onChange, max }: IconRatingProps) {
    return (
        <div className="rating-container">
            {Array.from({length: max}, (_, index) => {
                const ratingValue = index + 1;
                const isSelected = ratingValue <= value;
                return (
                    <button key={ratingValue} type="button" className={isSelected ? "rating-icon-button selected" : "rating-icon-button"} onClick={() => onChange(ratingValue)}>
                        <Icon/>
                    </button>
                )
            })}
        </div>
    )
}