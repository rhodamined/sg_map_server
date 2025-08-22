# --- imports ---- #
import datetime
import sys
import pandas as pd
import json
import os
from pathlib import Path

import warnings
warnings.filterwarnings("ignore", category=FutureWarning)

# Notes: 
# - several reference file paths are hard-coded in
# - the json file read produces a 'datetime' FutureWarning due to internal bug to pandas
# -- it is a minor warning and suppressed using the above 'filterwarnings' code
# -- it is due to the json using a mix of ints and strings as keys

if __name__ == "__main__":
    if len(sys.argv) > 1:
        print(f"Argument 1: {sys.argv[1]}")
        
        # ------------------------------------------------ #
        # CONFIG DIRECTORY & FILE PATHS
        # ------------------------------------------------ #
        # Received date to process as an argument in format 'yyyy-mm-dd' e.g. '2025-08-11' for August 11, 2025
        date_str = sys.argv[1]
        
        # directory of carparks to iterate over
        carpark_directory = Path('./data/carpark_availability/' + date_str)  # set directory path
        
        # directory of carparks to iterate over
        subway_directory = Path('./data/subway_crowdedness/' + date_str)  # set directory path

        # path to ref: carpark IDs to kml
        path_to_carpark_ids = './ref/SG_carpark_IDs.json'
        
        # path to ref: subway stations to kml
        path_to_subway_kml = './ref/SG_Station_Subzone_Lookup.csv'
        
        # path to ref: subzone kml ref by region
        path_to_subzone_kml_ref_by_region = './ref/subzone_kml_ref_by_region.csv'
        
        # path to save csv
        path_to_save_csv = './output/csv/' + date_str + '.csv'
        
        # path to save json
        path_to_save_json = './output/json/' + date_str + '.json'
        
        # path to save logs
        path_to_output_log = './output/log.txt'
        
        # ------------------------------------------------ #
        # CONFIG TOLERANCE
        # ------------------------------------------------ #
        tolerance = 0.8
        
        # ------------------------------------------------ #
        # READ CARPARK FILES
        # ------------------------------------------------ #
        # Open the JSON file in read mode ('r')
        # Process it to add time info from file string
        # Return as pandas dataframe
        # Note: file paths and file strings are different; need different methods to split string

        def read_json_to_pd(file_path):
            try:
                with open(file_path, 'r') as file:
                    # -- Load the JSON data from the file into a Python object
                    json_data = json.load(file)

                    # -- this json has a metadata value; ignore it, parse json out of just the value
                    df =  pd.json_normalize(json_data['value'])

                    # -- add columns for timestamps
                    # time_str format expected: 2025-08-11_00-00

                    # -- syntax for file string: 
                    # time_str = file_str.split('/')[-1].split('.')[0] 

                    # -- syntax for file path:
                    # time_str = os.path.splitext(file_path)[0].split('\\')[-1]  # - windows
                    time_str = os.path.splitext(file_path)[0].split('/')[-1]  # - mac

                    df['year'] = int(time_str.split('-')[0])
                    df['month'] = int(time_str.split('-')[1])
                    df['day'] = int(time_str.split('-')[2].split('_')[0])
                    df['hour'] = int(time_str.split('_')[-1].split('-')[0])
                    df['minute'] = int(time_str.split('_')[-1].split('-')[-1])
                    
                    return df
                        
            except FileNotFoundError:
                print("Error: '" + file_path + "' not found.")
            except json.JSONDecodeError:
                print("Error: Invalid JSON format in '" + file_path + "data.json'.")


        # Read in all files from directory and concat into single dataframe
        # Even for a single day it's kind of big, might take a second

        li = []

        for file in carpark_directory.iterdir():  
            if file.is_file():  # Check if it's a file
                minute = file.name.split('.')[0].split('-')[-1]
                minute_range = ["00", "15", "30", "45"]  # specifically opt into the timestamps...

                if minute in minute_range:
                    df = read_json_to_pd(file)
                    li.append(df)
                
        carpark_all = pd.concat(li, axis=0, ignore_index=True)
        
        # print(carpark_all[:4])
        
        # ------------------------------------------------ #
        # DATA VALIDATIOM
        # Check if each ID has 24hrs of info
        # ingesting more data is good -- sometimes records missing, ends up taking the average over an hour
        # ------------------------------------------------ #
        # make sure all records are for the correct date
        yyyy = int(date_str.split('-')[0])
        dd = int(date_str.split('-')[-1])
        mo = int(date_str.split('-')[1])
        carpark_all = carpark_all[carpark_all['year'] == yyyy] 
        carpark_all = carpark_all[carpark_all['month'] == mo]
        carpark_all = carpark_all[carpark_all['day'] == dd] 
        
        # Remove duplicates
        carpark_all.drop_duplicates(subset=['CarParkID', 'LotType', 'hour', 'minute'], keep="first", inplace=True)
        orig_id_total = len(carpark_all['CarParkID'].unique()) # to calculate percentage

        # Find every carpark record that does NOT have 24hrs worth of data, and remove it
        to_remove = carpark_all.drop_duplicates(subset=['CarParkID', 'LotType', 'hour'], keep="first")
        to_remove = to_remove.groupby(['CarParkID', 'LotType']).size()
        to_remove = pd.DataFrame(to_remove)
        to_remove = to_remove[to_remove[0] < 24]
        to_remove = to_remove.reset_index()

        # Filter carpark_all to keep only rows where carpark id is NOT in to_remove
        carpark_all = carpark_all[~carpark_all['CarParkID'].isin(to_remove['CarParkID'])].reset_index(drop=True)
   
        # check percentage of 'good' records
        new_id_total = len(carpark_all['CarParkID'].unique())
        percent_good = new_id_total/orig_id_total
        
        print("Carpark IDs kept: " + str(new_id_total) + "/" + str(orig_id_total))

        # exit the process if data isn't good enough
        if percent_good < tolerance:
            sys.exit("This carpark dataset is " + str(percent_good) + " good The tolerance is set to " + str(tolerance) + ".")
        
        # ------------------------------------------------ #
        # CLEAN CARPARK DF
        # ------------------------------------------------ #

        # Standardize column names
        carpark_all = carpark_all.rename(columns={'CarParkID': 'id', 
                                'Development': 'development',
                                'AvailableLots': 'available_lots'})

        # Drop unnecessary columns
        carpark_all = carpark_all.drop(columns=['Area', 'Location', 'LotType', 'Agency'])
        carpark_all = carpark_all.dropna()

        # Aggregation & calculation of summary info
        carpark_minmax = carpark_all.groupby('id').agg(
            avail_min = ('available_lots', 'min'), 
            avail_max = ('available_lots', 'max'), 
            avail_avg = ('available_lots', 'mean'),  
        )

        # Merge min max avail back into main df
        carpark_all = carpark_all.merge(carpark_minmax, on="id")

        # Calculate normalized availability
        carpark_all['avail_norm'] = (carpark_all['available_lots'] - carpark_all['avail_min']) / (carpark_all['avail_max'] - carpark_all['avail_min'])
                     
        # Some lots have 0 change so normalizing will divide by 0... fill NAs with 0
        carpark_all['avail_norm'] = carpark_all['avail_norm'].fillna(0)
        
        
        # ------------------------------------------------ #
        # IMPORT REFERENCE JSON OF CARPARK-KML & MERGE
        # ------------------------------------------------ #
        # triggers a ton of warnings but works
        ref_kml = pd.read_json(path_to_carpark_ids, orient='index')
        ref_kml = ref_kml.reset_index()
        ref_kml = ref_kml.rename(columns={"index": "id"})
        
        carpark_kml = ref_kml[['id', 'subzone_kml', 'region_name', 'region_num']]

        carpark_all = carpark_all.merge(carpark_kml, on="id")


        # ------------------------------------------------ #
        # MERGE AND SUMMARIZE AVAILABLE LOTS PER KML
        # ------------------------------------------------ #
        carpark_grouped = carpark_all.groupby(['subzone_kml', 'hour'])

        carpark_summary = carpark_grouped.agg(avail_norm = ('avail_norm', 'mean'))
        carpark_summary = pd.DataFrame(carpark_summary)

        carpark_summary = carpark_summary.reset_index()
        
        # ------------------------------------------------ #
        # REMAP <AVAIL PER KML> TO <LED VALUES 0-255>
        # ------------------------------------------------ #
        carpark_summary['led_val'] = carpark_summary['avail_norm'] * 255
        carpark_summary['led_val'] = carpark_summary['led_val'].astype('int64')
        
        
        # ------------------------------------------------ #
        # READ SUBWAY FILES
        # ------------------------------------------------ #
        
        li = []

        for file in subway_directory.iterdir():  
            if file.is_file():  # Check if it's a file

                minute = file.name.split('.')[0].split('-')[-1]
                minute_range = ["00", "15", "30", "45"]  # specifically opt into the timestamps...

                if minute in minute_range:
                    df = read_json_to_pd(file)
                    li.append(df)


        subway_all = pd.concat(li, axis=0, ignore_index=True)
        subway_all.drop_duplicates(subset=['Station', 'hour', 'minute'], keep="first", inplace=True)

        # make sure these are all for the right date
        yyyy = int(date_str.split('-')[0])
        dd = int(date_str.split('-')[-1])
        mo = int(date_str.split('-')[1])
        subway_all = subway_all[subway_all['year'] == yyyy] 
        subway_all = subway_all[subway_all['month'] == mo]
        subway_all = subway_all[subway_all['day'] == dd] 

        orig_id_total = len(subway_all['Station'].unique()) # to calculate percentage

        # ------------------------------------------------ #
        # VALIDATION
        # Check if each ID has 24hrs of info
        # ingesting more data is good -- sometimes records missing, ends up taking the average over an hour
        # ------------------------------------------------ #

        # every carpark record needs to have at least 1 record for each of the 24hrs
        subway_all.drop_duplicates(subset=['Station', 'hour', 'minute'], keep="first")

        to_remove = subway_all.drop_duplicates(subset=['Station', 'hour'], keep="first")
        to_remove = to_remove.groupby(['Station']).size()
        to_remove = pd.DataFrame(to_remove)
        to_remove = to_remove[to_remove[0] < 24]
        to_remove = to_remove.reset_index()
        
        # Filter subway_all to keep only rows where carpark id is NOT in ids_to_remove
        subway_all = subway_all[~subway_all['Station'].isin(to_remove['Station'])].reset_index(drop=True)
        
        # check percentage of 'good' records
        new_id_total = len(subway_all['Station'].unique())
        percent_good = new_id_total/orig_id_total
        
        print("Subway stations kept: " + str(new_id_total) + "/" + str(orig_id_total))

        # exit the process if data isn't good enough
        if percent_good < tolerance:
            sys.exit("This subway dataset is " + str(percent_good) + " good The tolerance is set to " + str(tolerance) + ".")
        
        # ------------------------------------------------ #
        # CLEAN SUBWAY DF
        # ------------------------------------------------ #

        # standardize column names
        subway_all = subway_all.rename(columns={'Station': 'station_code', 
                                'CrowdLevel': 'crowd_level'})

        # drop unnecessary columns
        subway_all = subway_all.drop(columns=['StartTime', 'EndTime'])
        subway_all['crowd_level'] = subway_all['crowd_level'].map({'l': 0, 'm': 0.5, 'h': 1}) #remap crowdedness to numbers


        subway_all = subway_all.dropna(subset=['station_code'])
        subway_all['crowd_level'] = subway_all['crowd_level'].fillna(0)


        # ------------------------------------------------ #
        # IMPORT REFERENCE OF STATION-KML 
        # ------------------------------------------------ #

        # triggers a ton of warnings but works
        station_ref = pd.read_csv(path_to_subway_kml)  
        subway_kml = station_ref[['station_code', 'station_name', 'subzone_kml', 'region_name', 'region_num']]
        subway_all = subway_all.merge(subway_kml, on="station_code")

        # ------------------------------------------------ #
        # MERGE AND SUMMARIZE SUBWAY CROWDEDNESS PER KML
        # ------------------------------------------------ #
        subway_grouped = subway_all.groupby(['subzone_kml', 'hour'])
        subway_summary = subway_grouped.agg(crowd_mean = ('crowd_level', 'mean'))
        subway_summary = pd.DataFrame(subway_summary)
        subway_summary = subway_summary.reset_index()
        
        # add LED vals by remapping normalized val of 0 - 1 to 0-255 (inverted -- so more avail is more dim)
        subway_summary['subway_led_val'] = subway_summary['crowd_mean'] * 255 
        subway_summary['subway_led_val'] = subway_summary['subway_led_val'].astype('int64')
        
        # ------------------------------------------------ #
        # IMPORT CSV REFERENCE OF LEDS-KMLS & MERGE
        # ------------------------------------------------ #
        led_ref = pd.read_csv(path_to_subzone_kml_ref_by_region)
        
        # merge with carparks, merge right to preserve ALL LED #s
        # All leds / kmls without hourly lot data will have only 1 row of NAs
        summary_df = carpark_summary.merge(led_ref, how="right", on="subzone_kml")
        
        # merge with subways; similarly may have NAs
        summary_df = summary_df.merge(summary_df, how="right")

        # ------------------------------------------------ #
        # CLEAN & REORDER DATAFRAME
        # ------------------------------------------------ #
        # fill NAs with 0s 
        summary_df['led_val'] = summary_df['led_val'].fillna(0)
        summary_df['subway_led_val'] = summary_df['subway_led_val'].fillna(0)
        summary_df['hour'] = summary_df['hour'].fillna(0)
        summary_df['avail_norm'] = summary_df['avail_norm'].fillna(0)
        summary_df['crowd_mean'] = summary_df['crowd_mean'].fillna(0)
        
        # recast floats to ints
        summary_df['led_val'] = summary_df['led_val'].astype('int64')
        summary_df['subway_led_val'] = summary_df['subway_led_val'].astype('int64')
        summary_df['hour'] = summary_df['hour'].astype('int64')

        # sort by region, led# and hour
        summary_df = summary_df.sort_values(by=['region_no', 'led_no', 'hour'])

        # reorder
        summary_df = summary_df[['region_no', 'region_n', 'led_no', 'hour', 'avail_norm', 'crowd_mean', 'led_val', 'subway_led_val', 'subzone_no', 'subzone_n', 'subzone_kml']]
        summary_df = summary_df.reset_index(drop=True)

        # ------------------------------------------------ #
        # WRITE DATAFRAME TO CSV
        # ------------------------------------------------ #
        summary_df.to_csv(path_to_save_csv, index = False)

        # print(summary_df[:4])
        
        # ------------------------------------------------ #
        # FORMAT TO DICT FOR JSON 
        # ------------------------------------------------ #
        # make copy of summary_df
        df = summary_df
        
        # collapse hour and led_val cols into lists; if only 1 val (no data), make array of 24 zeros to match data structure
        f = lambda x: x.tolist() if len(x) > 1 else [0]*24
        
        df = df.groupby(['region_n', 'region_no', 'led_no','subzone_no', 'subzone_n', 'subzone_kml']).agg(
            hour = ('hour', f),  
            led_val = ('led_val', f), 
            subway_led_val = ('subway_led_val', f),  
            avail_norm = ('avail_norm', f),   
            crowd_mean = ('crowd_mean', f),
        ).reset_index().reindex(df.columns, axis=1)

        # choose cols Matthew needs
        df = df[['region_n', 'led_no', 'led_val', 'subzone_n', 'subzone_kml']] 

        # rename to Matthew's json format
        df = df.rename(columns={'led_no': 'led_number', 'led_val': 'carpark', 'subway_led_val': 'mrt', 'subzone_n': 'name', 'subzone_kml': 'kml'})
        
        # Group by region and turn rows into a list of dictionaries for each group
        df = df.groupby(['region_n'])[['led_number', 'carpark', 'mrt', 'name', 'kml']].apply(lambda x: x.to_dict(orient='records'))
        df = df.reset_index()

        # rename cols of new df shape
        df = df.rename(columns={"region_n": "name", 0: "subzones"})

        # put it all in a dict
        jj = { "regions": df.to_dict(orient='records')}

        # ------------------------------------------------ #
        # WRITE JSON TO FILE 
        # ------------------------------------------------ #
        
        # Open the file in write mode ("w")
        # The 'with' statement ensures the file is properly closed even if errors occur
        with open(path_to_save_json, "w") as json_file:
            json.dump(jj, json_file, indent=4) 
        
        # ------------------------------------------------ #
        # WRITE LOGS
        # ------------------------------------------------ #
        with open(path_to_output_log, "a") as f:
            f.write(f"Date provided: {sys.argv[1]}\n")
            f.write(f"Python script executed at: {datetime.datetime.now()}\n")
    else:
        print("No arguments provided. Please supply a date in format YYYY-MM-DD.")

    