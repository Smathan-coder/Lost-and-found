-- Create function to generate potential matches
CREATE OR REPLACE FUNCTION generate_potential_matches()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    lost_item RECORD;
    found_item RECORD;
    match_score INTEGER;
BEGIN
    -- Loop through all unresolved lost items
    FOR lost_item IN 
        SELECT * FROM items 
        WHERE status = 'lost' AND is_resolved = false
    LOOP
        -- Find potential found items
        FOR found_item IN 
            SELECT * FROM items 
            WHERE status = 'found' 
            AND is_resolved = false 
            AND user_id != lost_item.user_id
            AND category = lost_item.category
        LOOP
            -- Calculate match score based on various factors
            match_score := 0;
            
            -- Category match (base score)
            IF found_item.category = lost_item.category THEN
                match_score := match_score + 40;
            END IF;
            
            -- Location similarity (simplified - check if locations contain similar words)
            IF LOWER(found_item.location) LIKE '%' || LOWER(SPLIT_PART(lost_item.location, ' ', 1)) || '%' 
               OR LOWER(lost_item.location) LIKE '%' || LOWER(SPLIT_PART(found_item.location, ' ', 1)) || '%' THEN
                match_score := match_score + 30;
            END IF;
            
            -- Date proximity (within 7 days)
            IF ABS(EXTRACT(EPOCH FROM (found_item.date_lost_found - lost_item.date_lost_found)) / 86400) <= 7 THEN
                match_score := match_score + 20;
            END IF;
            
            -- Title/description similarity (simplified)
            IF LOWER(found_item.title) LIKE '%' || LOWER(SPLIT_PART(lost_item.title, ' ', 1)) || '%'
               OR LOWER(lost_item.title) LIKE '%' || LOWER(SPLIT_PART(found_item.title, ' ', 1)) || '%' THEN
                match_score := match_score + 10;
            END IF;
            
            -- Only create matches with score >= 50
            IF match_score >= 50 THEN
                -- Check if match already exists
                IF NOT EXISTS (
                    SELECT 1 FROM matches 
                    WHERE lost_item_id = lost_item.id 
                    AND found_item_id = found_item.id
                ) THEN
                    INSERT INTO matches (lost_item_id, found_item_id, match_score)
                    VALUES (lost_item.id, found_item.id, match_score);
                END IF;
            END IF;
        END LOOP;
    END LOOP;
END;
$$;

-- Create trigger to automatically generate matches when new items are added
CREATE OR REPLACE FUNCTION trigger_generate_matches()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Generate matches for the new item
    PERFORM generate_potential_matches();
    RETURN NEW;
END;
$$;

-- Create trigger on items table
DROP TRIGGER IF EXISTS auto_generate_matches ON items;
CREATE TRIGGER auto_generate_matches
    AFTER INSERT ON items
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generate_matches();
